/**
 * The Escaneo's server side (docs/backlog/plan-escaneo-operar-a-mano.md, step 3).
 * Only /api/* reaches this script (run_worker_first in wrangler.jsonc); every
 * other path is the static Astro build, served straight from assets.
 *
 *   POST /api/scan     answers in, store read, result saved, public part out
 *   GET  /api/result   ?id=<id>, the public part of a saved result
 *   POST /api/event    funnel step from the page (sendBeacon)
 *   POST /api/unlock   contact in, full result out, Klaviyo and Telegram after
 *   GET  /api/go       ?r=<id>, counts the click and redirects to Jean's WhatsApp
 *   GET  /api/demo     ?r=<id>, the store's brand and products for the Comprobación's demo
 */

import { CONTACT, SITE } from "../src/consts.ts";
import { countryOf, parseContact } from "../src/escaneo/contacto.ts";
import { demoProducts, storeBrand } from "../src/escaneo/demo.ts";
import {
  computeFuga,
  ctaText,
  parseAnswers,
  parseChannel,
  routeLead,
  type Answers,
  type Platform,
  type Route,
  type Store,
} from "../src/escaneo/fuga.ts";
import { detectPlatform, findHallazgos, type Finding, type Product } from "../src/escaneo/hallazgos.ts";
import { notifyTelegram, saveToKlaviyo } from "./notify.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const ID_CHARS = "abcdefghijkmnpqrstuvwxyz23456789";

/** 10 random characters, with no look-alikes (l, o, 0, 1). */
function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return [...bytes].map((b) => ID_CHARS[b % ID_CHARS.length]).join("");
}

const isId = (v: string | null): v is string => !!v && /^[a-z0-9]{10}$/.test(v);
const isSession = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9-]{8,40}$/i.test(v);

// Some stores answer bots with a block page; a browser user agent gets the real one.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const MAX_HTML = 2_000_000;

async function get(url: string) {
  return fetch(url, {
    headers: { "user-agent": UA, accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  });
}

type StoreRead = { platform: Platform; reachable: boolean; findings: Finding[] };

/** Reads the public home page and catalog, the same as any visitor would. */
async function readStore(store: Store): Promise<StoreRead> {
  if (store.kind === "instagram") return { platform: "none", reachable: false, findings: [] };
  try {
    const home = await get(store.url);
    if (!home.ok) return { platform: "other", reachable: false, findings: [] };
    const html = (await home.text()).slice(0, MAX_HTML);
    const platform = detectPlatform(html);
    // The final URL, after redirects to the store's real domain.
    const origin = new URL(home.url || store.url).origin;

    let products: Product[] | null = null;
    if (platform === "shopify") {
      try {
        const res = await get(`${origin}/products.json?limit=250`);
        if (res.ok) products = ((await res.json()) as { products?: Product[] }).products ?? null;
      } catch {
        // A closed catalog only loses the promo findings.
      }
    }
    const findings = findHallazgos({ html, storeHost: new URL(origin).hostname, platform, products });
    return { platform, reachable: true, findings };
  } catch {
    return { platform: "other", reachable: false, findings: [] };
  }
}

type Row = {
  id: string;
  session: string | null;
  channel: string | null;
  answers: string;
  platform: Platform;
  route: Route;
  findings: string;
  unlocked_at: number | null;
};

/**
 * What the page may see. Before the unlock: the headline and only the worst
 * finding. After it: every finding and the lead's route.
 */
function view(row: Row) {
  const answers: Answers = JSON.parse(row.answers);
  const findings: Finding[] = JSON.parse(row.findings);
  const base = { id: row.id, answers, fuga: computeFuga(answers), platform: row.platform, finding: findings[0] ?? null };
  return row.unlocked_at ? { ...base, unlocked: true, route: row.route, findings } : { ...base, unlocked: false };
}

const resultUrl = (id: string) => `${SITE.url}/es/operar-a-mano/?r=${id}`;

async function logEvent(
  env: Env,
  e: { type: string; session?: string | null; step?: string | null; channel?: string | null; resultId?: string | null },
) {
  await env.DB.prepare("INSERT INTO events (at, session, type, step, channel, result_id) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(Date.now(), e.session ?? null, e.type, e.step ?? null, e.channel ?? null, e.resultId ?? null)
    .run();
}

async function scan(request: Request, env: Env, ctx: ExecutionContext) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const answers = parseAnswers(body?.answers);
  if (!answers) return json({ error: "invalid answers" }, 400);
  const session = isSession(body?.session) ? body.session : null;
  const channel = parseChannel(typeof body?.channel === "string" ? body.channel : null);

  const read = await readStore(answers.store);
  const fuga = computeFuga(answers);
  const id = newId();
  const route = routeLead(answers, read.platform);
  await env.DB.prepare(
    `INSERT INTO results (id, created_at, session, channel, answers, orders, payments, platform, reachable, route, hours_per_month, money_per_month, findings)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      Date.now(),
      session,
      channel,
      JSON.stringify(answers),
      answers.orders,
      answers.payments.join(","),
      read.platform,
      read.reachable ? 1 : 0,
      route,
      fuga.hoursPerMonth,
      fuga.moneyPerMonth,
      JSON.stringify(read.findings),
    )
    .run();
  ctx.waitUntil(logEvent(env, { type: "completed", session, channel, resultId: id }));
  return json(
    view({ id, session, channel, answers: JSON.stringify(answers), platform: read.platform, route, findings: JSON.stringify(read.findings), unlocked_at: null }),
  );
}

async function loadResult(env: Env, id: string) {
  return env.DB.prepare(
    "SELECT id, session, channel, answers, platform, route, findings, unlocked_at FROM results WHERE id = ?",
  )
    .bind(id)
    .first<Row>();
}

async function result(url: URL, env: Env) {
  const id = url.searchParams.get("id");
  const row = isId(id) ? await loadResult(env, id) : null;
  if (!row) return json({ error: "not found" }, 404);
  return json(view(row));
}

async function unlock(request: Request, env: Env, ctx: ExecutionContext) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : null;
  const contact = parseContact(body?.contact);
  // Without the Ley 1581 authorization nothing about the contact is kept.
  if (!contact || body?.consent !== true) return json({ error: "invalid contact" }, 400);
  const row = isId(id) ? await loadResult(env, id) : null;
  if (!row) return json({ error: "not found" }, 404);

  const now = Date.now();
  const country = countryOf(contact.whatsapp);
  await env.DB.prepare("UPDATE results SET unlocked_at = ?, country = ? WHERE id = ?").bind(now, country, row.id).run();
  const unlocked = { ...row, unlocked_at: now };
  const answers: Answers = JSON.parse(row.answers);
  const lead = {
    id: row.id,
    url: resultUrl(row.id),
    contact,
    country,
    channel: parseChannel(row.channel),
    answers,
    fuga: computeFuga(answers),
    platform: row.platform,
    route: row.route,
    findings: JSON.parse(row.findings),
    consentAt: now,
  };
  const session = isSession(body?.session) ? body.session : row.session;
  ctx.waitUntil(
    Promise.allSettled([
      logEvent(env, { type: "unlocked", session, channel: row.channel, resultId: row.id }),
      notifyTelegram(env, lead),
      saveToKlaviyo(env, lead),
    ]).then((results) => results.forEach((r) => r.status === "rejected" && console.error("unlock", row.id, r.reason))),
  );
  return json(view(unlocked));
}

/**
 * What the demo page needs, read fresh so the products and prices are today's.
 * Only for unlocked results: the demo is for leads Jean is already talking to.
 */
async function demo(url: URL, env: Env) {
  const id = url.searchParams.get("r");
  const row = isId(id) ? await loadResult(env, id) : null;
  if (!row || !row.unlocked_at) return json({ error: "not found" }, 404);
  const answers: Answers = JSON.parse(row.answers);
  if (answers.store.kind !== "url") return json({ error: "no store" }, 422);

  const home = await get(answers.store.url).catch(() => null);
  if (!home?.ok) return json({ error: "store unreachable" }, 502);
  const html = (await home.text()).slice(0, MAX_HTML);
  const origin = new URL(home.url || answers.store.url).origin;
  let products: Product[] | null = null;
  try {
    const res = await get(`${origin}/products.json?limit=250`);
    if (res.ok) products = ((await res.json()) as { products?: Product[] }).products ?? null;
  } catch {
    // Without a catalog the page asks Jean for the product by hand.
  }
  const country = await env.DB.prepare("SELECT country FROM results WHERE id = ?").bind(row.id).first<string>("country");
  return json({
    id: row.id,
    brand: storeBrand(html, origin),
    products: demoProducts(products),
    payments: answers.payments,
    country,
  });
}

const EVENT_TYPES = new Set(["view", "answer"]);
const STEPS = new Set(["store", "orders", "payments", "hours", "cod"]);

async function event(request: Request, env: Env) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = typeof body?.type === "string" && EVENT_TYPES.has(body.type) ? body.type : null;
  if (!type || !isSession(body?.session)) return new Response(null, { status: 400 });
  const step = typeof body?.step === "string" && STEPS.has(body.step) ? body.step : null;
  if (type === "answer" && !step) return new Response(null, { status: 400 });
  const channel = parseChannel(typeof body?.channel === "string" ? body.channel : null);
  await logEvent(env, { type, session: body.session, step, channel });
  return new Response(null, { status: 204 });
}

/** HEAD gets the same redirect without counting a click (link previews, curl -I). */
async function go(url: URL, env: Env, ctx: ExecutionContext, click = true) {
  const id = url.searchParams.get("r");
  const row = isId(id) ? await loadResult(env, id) : null;
  const text = row ? ctaText(JSON.parse(row.answers), row.id, row.route) : "Hola Jean, hice el Escaneo de operar a mano. Quiero mi Comprobación.";
  if (row && click) ctx.waitUntil(logEvent(env, { type: "click", session: row.session, channel: row.channel, resultId: row.id }));
  const to = CONTACT.whatsapp
    ? `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`
    : `mailto:${CONTACT.email}?subject=${encodeURIComponent("Quiero mi Comprobación")}&body=${encodeURIComponent(text)}`;
  return new Response(null, { status: 302, headers: { location: to, "cache-control": "no-store" } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname.replace(/\/$/, "")}`;
    try {
      switch (route) {
        case "POST /api/scan":
          return await scan(request, env, ctx);
        case "GET /api/result":
          return await result(url, env);
        case "POST /api/event":
          return await event(request, env);
        case "POST /api/unlock":
          return await unlock(request, env, ctx);
        case "GET /api/go":
          return await go(url, env, ctx);
        case "HEAD /api/go":
          return await go(url, env, ctx, false);
        case "GET /api/demo":
          return await demo(url, env);
      }
    } catch (err) {
      console.error(route, err);
      return json({ error: "server error" }, 500);
    }
    return url.pathname.startsWith("/api/") ? json({ error: "not found" }, 404) : env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
