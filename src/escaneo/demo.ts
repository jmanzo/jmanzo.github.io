/**
 * The Comprobación's demo (lead-magnets.md, "Demo de la Comprobación"): a
 * simulated WhatsApp chat between the merchant's store and one of its
 * customers, built from the store's public HTML and /products.json. Jean
 * records the screen while it plays and sends the video. No DOM and no
 * fetching: the Worker reads the store, the page plays the script.
 */

import type { PaymentMethod } from "./fuga.ts";
import type { Product } from "./hallazgos.ts";

export type Brand = {
  name: string;
  /** ISO code from Shopify.currency. Null when the page doesn't say. */
  currency: string | null;
  /** Absolute URL of the store's icon or logo. Null falls back to the initial. */
  icon: string | null;
};

const attr = (tag: string, name: string) =>
  tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"))?.[2] ?? null;

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const absolute = (url: string, origin: string) => {
  try {
    return new URL(url.startsWith("//") ? `https:${url}` : url, origin).toString();
  } catch {
    return null;
  }
};

export function storeBrand(html: string, origin: string): Brand {
  const siteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*>/i)?.[0];
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const host = new URL(origin).hostname.replace(/^www\./, "");
  // The page title is often "Inicio | Tienda" or "Tienda – Lema", so only its first part is used.
  const name = decode((siteName && attr(siteName, "content")) || title?.split(/\s[|–—-]\s/)[0] || "") || host;

  const currency = html.match(/Shopify\.currency\s*=\s*\{[^}]*"active"\s*:\s*"([A-Z]{3})"/)?.[1] ?? null;

  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const iconLink =
    links.find((l) => /rel=["'][^"']*apple-touch-icon/i.test(l)) ??
    links.find((l) => /rel=["'][^"']*\bicon\b/i.test(l));
  const logoImg = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).find((t) => /logo/i.test(attr(t, "class") ?? "") || /logo/i.test(attr(t, "alt") ?? ""));
  const src = (iconLink && attr(iconLink, "href")) || (logoImg && attr(logoImg, "src"));
  // Shopify's CDN resizes on the URL; favicons come at 32 px, too small for the avatar.
  const icon = src && !src.startsWith("data:") ? absolute(decode(src), origin)?.replace(/\b(width|height)=\d+/g, "$1=96") ?? null : null;

  return { name: name.slice(0, 40), currency, icon };
}

export type DemoProduct = { title: string; price: number; image: string | null };

/** The available products with a price, as the demo's picker shows them. */
export function demoProducts(products: Product[] | null, max = 30): DemoProduct[] {
  return (products ?? [])
    .map((p) => {
      const variant = p.variants.find((v) => v.available !== false);
      const price = Number(variant?.price);
      return variant && price > 0 ? { title: p.title, price, image: p.images?.[0]?.src ?? null } : null;
    })
    .filter((p): p is DemoProduct => p !== null)
    .slice(0, max);
}

// The locale that writes each currency the way its merchants do.
const MONEY_LOCALE: Record<string, string> = {
  COP: "es-CO", MXN: "es-MX", PEN: "es-PE", CLP: "es-CL", ARS: "es-AR", USD: "es-EC",
  EUR: "es-ES", GTQ: "es-GT", CRC: "es-CR", DOP: "es-DO", BOB: "es-BO", PYG: "es-PY",
  UYU: "es-UY", VES: "es-VE", HNL: "es-HN", NIO: "es-NI", PAB: "es-PA", BRL: "pt-BR",
};

/** "$ 129.900" for COP, "S/ 49.90" for PEN. Whole amounts drop the decimals. */
export function formatMoney(amount: number, currency: string | null): string {
  const code = currency ?? "USD";
  const whole = Number.isInteger(amount);
  try {
    return new Intl.NumberFormat(MONEY_LOCALE[code] ?? "es", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    })
      .format(amount)
      .replace(/\s/g, " ");
  } catch {
    return `${amount} ${code}`;
  }
}

/** A carrier the merchant's customers know, from the country of the WhatsApp. Jean can change it. */
export const CARRIER_BY_COUNTRY: Record<string, string> = {
  CO: "Coordinadora", MX: "Estafeta", PE: "Olva Courier", CL: "Starken", EC: "Servientrega",
  AR: "Andreani", VE: "MRW", GT: "Cargo Expreso", CR: "Correos de Costa Rica", PA: "Uno Express",
  BO: "Bolivia Express", PY: "AEX", UY: "DAC", ES: "SEUR",
};

export type Scene = "cod" | "proof";

/** Which scenes apply, from how the merchant gets paid. Same rule as arreglos() in fuga.ts. */
export function scenesFor(payments: PaymentMethod[]): Scene[] {
  const scenes: Scene[] = [];
  if (payments.includes("cod")) scenes.push("cod");
  if (payments.includes("proof") || payments.includes("wallet")) scenes.push("proof");
  // Card only: the confirmation scene still shows the order synced to the carrier.
  return scenes.length ? scenes : ["cod"];
}

export type Message =
  | { from: "store"; kind: "text"; text: string }
  | { from: "store"; kind: "order"; product: DemoProduct; total: string; number: string; note: string; buttons: string[] }
  | { from: "client"; kind: "text"; text: string }
  | { from: "client"; kind: "tap"; text: string }
  | { from: "client"; kind: "receipt"; total: string; reference: string }
  | { from: "system"; kind: "divider"; text: string };

export type DemoInput = {
  brand: Pick<Brand, "name" | "currency">;
  product: DemoProduct;
  customer: string;
  carrier: string;
  scenes: Scene[];
};

/** The chat, in order. The page adds the timing and the typing dots. */
export function demoScript({ brand, product, customer, carrier, scenes }: DemoInput): Message[] {
  const total = formatMoney(product.price, brand.currency);
  const msgs: Message[] = [];
  const carrierText = carrier.trim() || "la transportadora";

  if (scenes.includes("cod")) {
    msgs.push(
      { from: "store", kind: "text", text: `¡Hola, ${customer}! Gracias por tu compra en ${brand.name}.` },
      {
        from: "store",
        kind: "order",
        product,
        total,
        number: "#1043",
        note: "Pagas al recibir",
        buttons: ["Sí, confirmar", "Cambiar algo", "Cancelar"],
      },
      { from: "client", kind: "tap", text: "Sí, confirmar" },
      { from: "client", kind: "text", text: "¿Me llega antes del sábado?" },
      { from: "store", kind: "text", text: `Sí. Sale hoy con ${carrierText} y llega en 2 a 3 días hábiles.` },
      { from: "store", kind: "text", text: `Tu pedido ya va en camino. Guía ${carrierText}: 240185733.` },
    );
  }
  if (scenes.includes("proof")) {
    if (msgs.length) msgs.push({ from: "system", kind: "divider", text: "Días después, otro pedido" });
    msgs.push(
      { from: "client", kind: "text", text: "Hola, ya hice la transferencia del pedido #1044." },
      { from: "client", kind: "receipt", total, reference: "58213" },
      {
        from: "store",
        kind: "text",
        text: `Recibí tu comprobante: ${total}, referencia 58213. Coincide con tu pedido #1044. Ya lo estamos preparando.`,
      },
    );
  }
  return msgs;
}
