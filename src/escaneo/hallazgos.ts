/**
 * Automatic findings from the store's public HTML and catalog, with no DOM
 * and no fetching, so the Worker and the tests run the same code. The Worker
 * reads the pages and hands them in.
 *
 * The three families come from lead-magnets.md: promos (light version),
 * apps zombis and "Shopify va a apagar algo". The COD form and WhatsApp
 * signals back the main pain (operación manual). Detection started from
 * scanner.js in the Regla de 100 workspace.
 */

import type { Platform } from "./fuga.ts";

/** The fields of a /products.json product the findings and the demo use. */
export type Product = {
  handle: string;
  title: string;
  variants: { price: string; compare_at_price: string | null; available?: boolean }[];
  images?: { src: string }[];
};

export type Finding = {
  id: string;
  /** Higher is worse. The worst one is the finding visible before the unlock. */
  severity: number;
  title: string;
  detail: string;
};

export function detectPlatform(html: string): Exclude<Platform, "none"> {
  return /cdn\.shopify\.com|Shopify\.shop\s*=|\.myshopify\.com/.test(html) ? "shopify" : "other";
}

/** Script tag URLs from the asyncLoad loader Shopify renders in content_for_header. */
export function scriptTagUrls(html: string): string[] {
  const m = html.match(/function asyncLoad\(\)\s*\{\s*var urls\s*=\s*(\[[^\]]*\])/);
  if (!m) return [];
  try {
    const urls = JSON.parse(m[1]);
    return Array.isArray(urls) ? urls.filter((u): u is string => typeof u === "string") : [];
  } catch {
    return [];
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url, "https://x.invalid").hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

// Shopify's own hosts are not third-party apps.
const SHOPIFY_HOST = /(^|\.)(shopify\.com|shopifycdn\.com|shopifysvc\.com|shopifycloud\.com|myshopify\.com|shop\.app)$/;

/** Distinct external hosts the page loads scripts from, Shopify's and the store's own excluded. */
export function externalScriptHosts(html: string, storeHost: string): string[] {
  const own = storeHost.replace(/^www\./, "");
  const srcs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]);
  const hosts = [...srcs, ...scriptTagUrls(html)]
    .map(hostOf)
    .filter((h) => h && h !== "x.invalid" && h !== own && !SHOPIFY_HOST.test(h));
  return [...new Set(hosts)];
}

/**
 * "150.000", "$150,000", "1.299,90" or "49.99" as a number. The last
 * separator is decimal when 1 or 2 digits follow it, thousands otherwise.
 */
export function parseAmount(raw: string): number | null {
  const s = raw.replace(/[^\d.,]/g, "").replace(/[.,]$/, "");
  if (!/\d/.test(s)) return null;
  const last = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
  if (last === -1) return Number(s);
  const tail = s.slice(last + 1);
  const whole = s.slice(0, last).replace(/[.,]/g, "");
  return tail.length <= 2 ? Number(`${whole}.${tail}`) : Number(`${whole}${tail}`);
}

const textOf = (html: string) =>
  html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

/** The free shipping threshold the store announces, if it shows one with an amount. */
export function freeShippingThreshold(html: string): number | null {
  const text = textOf(html);
  for (const m of text.matchAll(/env[ií]os? gratis|free shipping/gi)) {
    const near = text.slice(Math.max(0, m.index! - 80), m.index! + m[0].length + 80);
    // The amount has to read as a threshold ("desde $150.000", "over $75"),
    // so a shipping price next to the promise ("Shipping $5.00") is skipped.
    const amount = near.match(
      /\b(?:desde|sobre|de|a partir de|mayores? a|superiores? a|over|above|from|of)\s+(?:US\$|\$|S\/\.?|Bs\.?|₡|€)\s?(\d[\d.,]*)/i,
    );
    const value = amount && parseAmount(amount[1]);
    if (value) return value;
  }
  return null;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es", { maximumFractionDigits: 0, useGrouping: "always" } as Intl.NumberFormatOptions).format(n);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const listed = (xs: string[], max = 3) =>
  xs.length > max ? `${xs.slice(0, max).join(", ")} y ${xs.length - max} más` : xs.join(", ");

// Known contraentrega order forms, matched on the page's markup.
const COD_FORMS: ReadonlyArray<[RegExp, string]> = [
  [/releasit/i, "Releasit"],
  [/easysell/i, "EasySell"],
  [/\bcod[-_ ]?form/i, "un formulario contraentrega"],
];

export function findHallazgos(input: {
  html: string;
  storeHost: string;
  platform: Exclude<Platform, "none">;
  /** From /products.json. Null when the store isn't Shopify or the catalog is closed. */
  products: Product[] | null;
}): Finding[] {
  const { html, storeHost, platform, products } = input;
  const found: Finding[] = [];

  // Shopify va a apagar algo.
  if (platform === "shopify") {
    const tags = [...new Set(scriptTagUrls(html).map(hostOf).filter(Boolean))];
    if (tags.length)
      found.push({
        id: "script-tags",
        severity: 90,
        title: `${plural(tags.length, "app de tu tienda carga", "apps de tu tienda cargan")} con script tags, y Shopify los apaga el 1 de marzo de 2027`,
        detail: `Desde esa fecha, lo que dependa de ellos deja de cargar sin ningún aviso en el admin: ${listed(tags)}.`,
      });
  }

  // Promos (light): prices from the first variant of each available product.
  const available = (products ?? []).filter((p) => p.variants.some((v) => v.available !== false));
  const prices = available.map((p) => Number(p.variants[0]?.price)).filter((n) => n > 0);
  const threshold = freeShippingThreshold(html);
  if (threshold && prices.length >= 5) {
    const over = prices.filter((p) => p >= threshold).length / prices.length;
    if (over >= 0.5)
      found.push({
        id: "free-shipping",
        severity: 70,
        title: `El ${Math.round(over * 100)}% de tus productos ya pasa solo el umbral de envío gratis`,
        detail: `Tu tienda anuncia envío gratis desde ${fmt(threshold)}, y la mitad de tu catálogo cuesta ${fmt(median(prices))} o más. Ese envío lo pagas tú en casi todos los pedidos de un solo producto.`,
      });
  }

  const brokenCompare = available.filter((p) =>
    p.variants.some((v) => v.compare_at_price && Number(v.compare_at_price) > 0 && Number(v.compare_at_price) <= Number(v.price)),
  );
  if (brokenCompare.length)
    found.push({
      id: "compare-at",
      severity: 50,
      title: `${plural(brokenCompare.length, "producto tiene", "productos tienen")} un precio tachado igual o menor al precio real`,
      detail: `Según el tema, eso muestra una oferta que no existe o un descuento en cero: ${listed(brokenCompare.map((p) => p.title))}.`,
    });

  const onSale = available.filter((p) =>
    p.variants.some((v) => Number(v.compare_at_price) > Number(v.price)),
  );
  if (available.length >= 10 && onSale.length / available.length >= 0.6)
    found.push({
      id: "always-on-sale",
      severity: 40,
      title: `El ${Math.round((onSale.length / available.length) * 100)}% de tu catálogo está en oferta`,
      detail: "Cuando casi todo tiene precio tachado, el cliente deja de verlo como descuento, y el margen se va igual.",
    });

  // Operación manual: signals that orders and chats are handled by hand.
  const cod = COD_FORMS.find(([re]) => re.test(html));
  if (cod)
    found.push({
      id: "cod-form",
      severity: 60,
      title: `Tu tienda toma pedidos contraentrega con ${cod[1]}`,
      detail: "Cada pedido entra sin confirmar, y alguien tiene que escribirle al cliente antes de despacharlo.",
    });

  // A chat link or a WhatsApp widget script, not any mention of the word.
  const chatLink = /href=["'][^"']*(wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send)/i;
  const widget = /<script\b[^>]*\bsrc=["'][^"']*whats?app/i;
  if (chatLink.test(html) || widget.test(html))
    found.push({
      id: "whatsapp",
      severity: 20,
      title: "Tu tienda manda a los clientes a WhatsApp",
      detail: "Cada pregunta que llega por ahí la responde una persona, a la hora que pueda.",
    });

  // Apps zombis (light): how many outside services the home page loads.
  const hosts = externalScriptHosts(html, storeHost);
  if (hosts.length >= 10)
    found.push({
      id: "external-scripts",
      severity: 30,
      title: `Tu página de inicio carga scripts de ${hosts.length} servicios externos`,
      detail: `Cada app que ya no usas y sigue cargando te cobra en velocidad, y a veces en mensualidad: ${listed(hosts)}.`,
    });

  return found.sort((a, b) => b.severity - a.severity);
}
