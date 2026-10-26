/**
 * Where an unlocked Escaneo goes: Klaviyo keeps the contact, Jean's Telegram
 * gets the notice and he creates the lead by hand with "Add prospect"
 * (lead-magnets.md, "CRM (versión 1)"). Both run after the response, so a
 * failure here never blocks the merchant; it only shows in the Worker logs.
 */

import { SITE } from "../src/consts.ts";
import type { Contact } from "../src/escaneo/contacto.ts";
import { resultEmail } from "../src/escaneo/email.ts";
import {
  ORDER_BANDS,
  PAYMENT_METHODS,
  arreglos,
  fugaSummary,
  storeLabel,
  type Answers,
  type Channel,
  type Fuga,
  type Platform,
  type Route,
} from "../src/escaneo/fuga.ts";
import type { Finding } from "../src/escaneo/hallazgos.ts";

export type Lead = {
  id: string;
  url: string;
  contact: Contact;
  country: string | null;
  channel: Channel | null;
  answers: Answers;
  fuga: Fuga;
  platform: Platform;
  route: Route;
  findings: Finding[];
  consentAt: number;
};

const ROUTE_LABEL: Record<Route, string> = {
  comprobacion: "Califica para la Comprobación",
  email: "Ruta email: menos de 10 pedidos al día",
  espera: "Lista de espera: no está en Shopify",
};

const ordersLabel = (a: Answers) => ORDER_BANDS.find((b) => b.id === a.orders)!.label;
const paymentLabels = (a: Answers) =>
  a.payments.map((p) => PAYMENT_METHODS.find((m) => m.id === p)!.label);

export function telegramText(lead: Lead): string {
  const { contact: c, answers: a } = lead;
  return [
    `Escaneo desbloqueado. ${ROUTE_LABEL[lead.route]}`,
    "",
    `${c.name} · ${storeLabel(a.store)}`,
    `WhatsApp: https://wa.me/${c.whatsapp}`,
    `Email: ${c.email ?? "no lo dio"}`,
    `País: ${lead.country ?? "sin detectar"} · Canal: ${lead.channel ?? "sin canal"}`,
    "",
    `Pedidos al día: ${ordersLabel(a)}`,
    `Le pagan con: ${paymentLabels(a).join(", ")}`,
    `Fuga: ${fugaSummary(lead.fuga)}`,
    `Plataforma: ${lead.platform}`,
    "",
    lead.findings.length ? "Hallazgos:" : "Sin hallazgos automáticos.",
    ...lead.findings.map((f) => `- ${f.title}`),
    "",
    `Resultado: ${lead.url}`,
    "Créalo en el CRM con Add prospect.",
  ].join("\n");
}

export async function notifyTelegram(env: Env, lead: Lead) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn("telegram: no secrets, skipped\n" + telegramText(lead));
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: telegramText(lead), disable_web_page_preview: true }),
  });
  if (!res.ok) console.error("telegram", res.status, await res.text());
}

// Keep in step with KLAVIYO_REVISION in scripts/setup-escaneo.sh.
const KLAVIYO_REVISION = "2026-07-15";
export const KLAVIYO_METRIC = "Escaneo desbloqueado";

async function klaviyo(env: Env, path: string, body: unknown) {
  return fetch(`https://a.klaviyo.com/api/${path}`, {
    method: "POST",
    headers: {
      authorization: `Klaviyo-API-Key ${env.KLAVIYO_API_KEY}`,
      revision: KLAVIYO_REVISION,
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  });
}

async function ensureOk(what: string, res: Response) {
  if (!res.ok) throw new Error(`klaviyo ${what}: ${res.status} ${await res.text()}`);
  return res;
}

/** The latest Escaneo, as profile properties. A later Escaneo overwrites them. */
export function klaviyoProperties(lead: Lead) {
  const a = lead.answers;
  return {
    whatsapp: `+${lead.contact.whatsapp}`,
    escaneo_id: lead.id,
    escaneo_url: lead.url,
    escaneo_tienda: storeLabel(a.store),
    escaneo_plataforma: lead.platform,
    escaneo_ruta: lead.route,
    escaneo_pedidos_dia: ordersLabel(a),
    escaneo_pagos: paymentLabels(a),
    escaneo_horas_mes: lead.fuga.hoursPerMonth,
    escaneo_plata_mes: lead.fuga.moneyPerMonth,
    escaneo_fuga: fugaSummary(lead.fuga),
    escaneo_hallazgos: lead.findings.map((f) => f.title),
    escaneo_pais: lead.country,
    escaneo_canal: lead.channel,
    // Proof of the Ley 1581 authorization: when, and the policy it pointed to.
    autorizacion_datos_at: new Date(lead.consentAt).toISOString(),
    autorizacion_datos_politica: "https://jeanmanzo.com/es/privacidad/",
  };
}

export async function saveToKlaviyo(env: Env, lead: Lead) {
  if (!env.KLAVIYO_API_KEY || !env.KLAVIYO_LIST_ID) {
    console.warn("klaviyo: no secrets, skipped", JSON.stringify(klaviyoProperties(lead)));
    return;
  }
  const { contact: c } = lead;
  const [first, ...rest] = c.name.split(" ");
  // The WhatsApp number identifies the merchant across Escaneos, with or without email.
  const identity = { external_id: `wa:${c.whatsapp}`, ...(c.email ? { email: c.email } : {}) };
  const attributes = {
    ...identity,
    first_name: first,
    last_name: rest.join(" ") || undefined,
    phone_number: `+${c.whatsapp}`,
    properties: klaviyoProperties(lead),
  };
  const importProfile = (attrs: object) => klaviyo(env, "profile-import/", { data: { type: "profile", attributes: attrs } });
  let res = await importProfile(attributes);
  // Klaviyo rejects the whole profile over a phone it can't validate. The
  // number is still in the whatsapp property.
  if (res.status === 400) res = await importProfile({ ...attributes, phone_number: undefined });
  const profileId = ((await (await ensureOk("profile", res)).json()) as { data: { id: string } }).data.id;

  const list = { data: { type: "list", id: env.KLAVIYO_LIST_ID } };
  await Promise.all([
    // With an email, subscribing (the checkbox is the consent) also adds them
    // to the list. Without one, they join the list with no email consent.
    c.email
      ? klaviyo(env, "profile-subscription-bulk-create-jobs/", {
          data: {
            type: "profile-subscription-bulk-create-job",
            attributes: {
              profiles: {
                data: [
                  { type: "profile", attributes: { email: c.email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } },
                ],
              },
              historical_import: false,
            },
            relationships: { list },
          },
        }).then((r) => ensureOk("subscribe", r))
      : klaviyo(env, `lists/${env.KLAVIYO_LIST_ID}/relationships/profiles/`, {
          data: [{ type: "profile", id: profileId }],
        }).then((r) => ensureOk("list", r)),
    // The event the "Escaneo: resultado por email" flow starts from. Only with
    // an email from this unlock: without one the event matches the profile by
    // WhatsApp, and an earlier Escaneo's email would get this result.
    c.email && klaviyo(env, "events/", {
      data: {
        type: "event",
        attributes: {
          metric: { data: { type: "metric", attributes: { name: KLAVIYO_METRIC } } },
          profile: { data: { type: "profile", attributes: identity } },
          unique_id: `${lead.id}-${lead.consentAt}`,
          properties: {
            ...klaviyoProperties(lead),
            hallazgos: lead.findings.map((f) => ({ titulo: f.title, detalle: f.detail })),
            arreglos: arreglos(lead.answers).map((m) => ({ titulo: m.title, detalle: m.body })),
            ...resultEmail({
              answers: lead.answers,
              platform: lead.platform,
              route: lead.route,
              findings: lead.findings,
              ctaUrl: `${SITE.url}/api/go?r=${lead.id}`,
            }),
          },
        },
      },
    }).then((r) => ensureOk("event", r)),
  ]);
}
