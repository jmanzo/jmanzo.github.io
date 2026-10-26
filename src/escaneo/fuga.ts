/**
 * The Escaneo's math and routing, with no DOM and no imports, so the page
 * script, the Worker and the tests all run the same code.
 *
 * The Fuga only uses the merchant's own answers, never market averages
 * (docs/backlog/plan-escaneo-operar-a-mano.md).
 */

/** Orders-per-day bands. `perDay` is the number the math uses for the band. */
export const ORDER_BANDS = [
  { id: "lt5", label: "Menos de 5", perDay: 3 },
  { id: "5-9", label: "5 a 9", perDay: 7 },
  { id: "10-24", label: "10 a 24", perDay: 17 },
  { id: "25-49", label: "25 a 49", perDay: 37 },
  { id: "50+", label: "50 o más", perDay: 50 },
] as const;
export type OrderBand = (typeof ORDER_BANDS)[number]["id"];

export const PAYMENT_METHODS = [
  { id: "cod", label: "Contraentrega" },
  { id: "proof", label: "Transferencia o pago móvil con comprobante" },
  { id: "card", label: "Tarjeta o pasarela de pago" },
  { id: "wallet", label: "Billetera digital o cripto" },
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

/** The outreach channel, from `?c=` on the link. Anything else is dropped. */
export const CHANNELS = ["wa", "li", "em"] as const;
export type Channel = (typeof CHANNELS)[number];

export const parseChannel = (value: string | null): Channel | null =>
  CHANNELS.find((c) => c === value) ?? null;

export type Store =
  | { kind: "url"; url: string; host: string }
  | { kind: "instagram"; handle: string };

/** Accepts "tienda.com", "https://www.tienda.com/products/x" or "@tienda". */
export function parseStore(raw: string): Store | null {
  const value = raw.trim();
  const handle = value.match(/^@([a-z0-9._]{1,30})$/i)
    ?? value.match(/instagram\.com\/([a-z0-9._]{1,30})/i);
  if (handle) return { kind: "instagram", handle: handle[1].toLowerCase() };

  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) return null;
    const host = url.hostname.toLowerCase();
    return { kind: "url", url: `https://${host}`, host };
  } catch {
    return null;
  }
}

export type Answers = {
  store: Store;
  orders: OrderBand;
  payments: PaymentMethod[];
  /** Total hours a day spent confirming, checking proofs and handing orders to the carrier. */
  hoursPerDay: number;
  /** Only when `payments` includes "cod". */
  cod?: { rejectedPerTen: number; returnCost: number };
};

export type Fuga = {
  ordersPerDay: number;
  hoursPerMonth: number;
  /** Money lost to returned COD shipments, in the merchant's own currency. Null without COD. */
  moneyPerMonth: number | null;
};

const DAYS = 30;

export function computeFuga(a: Answers): Fuga {
  const ordersPerDay = ORDER_BANDS.find((b) => b.id === a.orders)!.perDay;
  const hoursPerMonth = Math.round(a.hoursPerDay * DAYS);
  const moneyPerMonth =
    a.payments.includes("cod") && a.cod
      ? Math.round(ordersPerDay * DAYS * (a.cod.rejectedPerTen / 10) * a.cod.returnCost)
      : null;
  return { ordersPerDay, hoursPerMonth, moneyPerMonth };
}

export type Platform = "shopify" | "other" | "none";

/**
 * Which offer the lead gets (lead-magnets.md, "Ruta de cada lead").
 * - comprobacion: 10+ orders a day on Shopify. CTA to Jean's WhatsApp.
 * - espera: another platform or only Instagram. Waitlist plus migration offer.
 * - email: under 10 orders a day. Klaviyo email with a CRO or dev offer.
 */
export type Route = "comprobacion" | "espera" | "email";

export function routeLead(a: Pick<Answers, "orders">, platform: Platform): Route {
  const qualifies = ORDER_BANDS.find((b) => b.id === a.orders)!.perDay >= 10;
  if (!qualifies) return "email";
  return platform === "shopify" ? "comprobacion" : "espera";
}

/** What the page sends the Worker: the raw answers, with the store as typed. */
export type RawAnswers = Omit<Answers, "store"> & { store: string };

/** Checks answers that come from outside (the Worker gets them from the page). */
export function parseAnswers(raw: unknown): Answers | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const store = typeof r.store === "string" ? parseStore(r.store) : null;
  const orders = ORDER_BANDS.find((b) => b.id === r.orders)?.id;
  const payments = Array.isArray(r.payments)
    ? [...new Set(PAYMENT_METHODS.map((m) => m.id).filter((id) => (r.payments as unknown[]).includes(id)))]
    : [];
  const hoursPerDay = Number(r.hoursPerDay);
  if (!store || !orders || !payments.length || !(hoursPerDay > 0 && hoursPerDay <= 24)) return null;

  let cod: Answers["cod"];
  if (payments.includes("cod")) {
    const c = (r.cod ?? {}) as Record<string, unknown>;
    const rejectedPerTen = Number(c.rejectedPerTen);
    const returnCost = Number(c.returnCost);
    if (!Number.isInteger(rejectedPerTen) || rejectedPerTen < 0 || rejectedPerTen > 10) return null;
    if (!(returnCost > 0 && returnCost < 1e10)) return null;
    cod = { rejectedPerTen, returnCost };
  }
  return { store, orders, payments, hoursPerDay, cod };
}

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("es", { maximumFractionDigits: 0, useGrouping: "always" } as Intl.NumberFormatOptions).format(n);

export const storeLabel = (s: Store) => (s.kind === "url" ? s.host : `@${s.handle}`);

/** "75 horas al mes", plus the money when there is COD. */
export function fugaSummary(f: Fuga): string {
  const hours = `${formatNumber(f.hoursPerMonth)} horas`;
  return f.moneyPerMonth === null
    ? `${hours} al mes`
    : `${hours} y ${formatNumber(f.moneyPerMonth)} al mes en envíos que vuelven`;
}

const formatDecimal = (n: number) => new Intl.NumberFormat("es", { maximumFractionDigits: 1 }).format(n);

/** The math behind the Fuga, line by line, shown after the unlock. */
export function fugaBreakdown(a: Answers): { title: string; rows: [string, string][] }[] {
  const f = computeFuga(a);
  const sections = [
    {
      title: "Tiempo",
      rows: [
        [`${formatDecimal(a.hoursPerDay)} horas al día × ${DAYS} días`, `${formatNumber(f.hoursPerMonth)} horas al mes`],
        [`${formatNumber(f.hoursPerMonth)} horas ÷ 8 horas por jornada`, `${formatNumber(Math.round(f.hoursPerMonth / 8))} jornadas al mes`],
        ["En un año", `${formatNumber(f.hoursPerMonth * 12)} horas`],
      ] as [string, string][],
    },
  ];
  if (a.cod && f.moneyPerMonth !== null) {
    const ordersPerMonth = f.ordersPerDay * DAYS;
    const returned = Math.round((ordersPerMonth * a.cod.rejectedPerTen) / 10);
    sections.push({
      title: "Contraentrega",
      rows: [
        [`${formatNumber(f.ordersPerDay)} pedidos al día × ${DAYS} días`, `${formatNumber(ordersPerMonth)} pedidos al mes`],
        [`${a.cod.rejectedPerTen} de cada 10 rechazados`, `${formatNumber(returned)} envíos que vuelven`],
        [`${formatNumber(returned)} × ${formatNumber(a.cod.returnCost)} por envío`, `${formatNumber(f.moneyPerMonth)} al mes`],
        ["En un año", formatNumber(f.moneyPerMonth * 12)],
      ],
    });
  }
  return sections;
}

/** The plan de Arreglos: the product modules that apply to how the merchant gets paid. */
export function arreglos(a: Pick<Answers, "payments">): { title: string; body: string }[] {
  const plan = [];
  if (a.payments.includes("cod"))
    plan.push({
      title: "Contraentrega",
      body: "Cada pedido nuevo le llega al cliente por WhatsApp con botones para confirmar o cancelar. Tú solo ves los que necesitan a una persona.",
    });
  if (a.payments.includes("proof") || a.payments.includes("wallet"))
    plan.push({
      title: "Comprobantes",
      body: "El comprobante se lee solo, se cruza con el pedido y te aviso si el monto o la referencia no cuadran.",
    });
  plan.push({
    title: "Sincronización de pedidos",
    body: "El pedido confirmado pasa solo a Dropi o a tu transportadora con su guía, y el cliente recibe el tracking sin que nadie se lo mande.",
  });
  return plan;
}

/** The Fuga's headline, as the result and the email show it. */
export function fugaHeadline(a: Answers): { hours: string; money: string | null; basis: string } {
  const f = computeFuga(a);
  const basis = [`${formatNumber(f.ordersPerDay)} pedidos por día`, `${formatDecimal(a.hoursPerDay)} horas diarias`];
  if (a.cod) basis.push(`${a.cod.rejectedPerTen} de cada 10 rechazados a ${formatNumber(a.cod.returnCost)} cada envío`);
  return {
    hours: `${formatNumber(f.hoursPerMonth)} horas al mes`,
    money: f.moneyPerMonth === null ? null : `y ${formatNumber(f.moneyPerMonth)} al mes en envíos que vuelven`,
    basis: `Con ${basis.join(", ")}.`,
  };
}

/** Shown instead of the findings when there are none. */
export const noFindingsText = (platform: Platform) =>
  platform === "none"
    ? "Con un @ de Instagram no hay tienda que revisar desde fuera. La Comprobación mira tu WhatsApp de ventas."
    : "No encontré problemas desde fuera. La Comprobación revisa lo que solo se ve por dentro.";

/** The route's offer (lead-magnets.md, "Ruta de cada lead"). The price never shows. */
export function routeCopy(route: Route, platform: Platform): { title: string; body: string; cta: string } {
  switch (route) {
    case "comprobacion":
      return {
        title: "Tu tienda califica para la Comprobación",
        body: "Pruebo cuánto tarda en responder tu WhatsApp de ventas y te mando una demo con tus productos. Es gratis y no tienes que instalar nada.",
        cta: "Quiero mi Comprobación",
      };
    case "email":
      return {
        title: "Con tu volumen, lo que más te mueve ahora es vender más",
        body: "Puedo revisar tu tienda y decirte qué arreglaría primero para que te compren más.",
        cta: "Quiero saber qué arreglar primero",
      };
    case "espera":
      return {
        title: "Por ahora esto funciona solo con Shopify",
        body:
          platform === "none"
            ? "Te anoté en la lista de espera para cuando funcione con ventas por Instagram. Si lo quieres antes, puedo montarte la tienda en Shopify."
            : "Te anoté en la lista de espera para cuando funcione con tu plataforma. Si lo quieres antes, puedo migrar tu tienda a Shopify.",
        cta: "Quiero pasar a Shopify",
      };
  }
}

/** What the lead asks Jean for, by route (lead-magnets.md, "Ruta de cada lead"). */
export const ROUTE_ASK: Record<Route, string> = {
  comprobacion: "Quiero mi Comprobación.",
  email: "Quiero saber qué arreglarías primero en mi tienda.",
  espera: "Quiero pasar mi tienda a Shopify.",
};

/** The message prefilled in Jean's WhatsApp. The result ID lets him open it. */
export const ctaText = (a: Answers, id?: string, route: Route = "comprobacion") =>
  `Hola Jean, hice el Escaneo de operar a mano para ${storeLabel(a.store)}${id ? ` (resultado ${id})` : ""}. Me sale que se me van ${fugaSummary(computeFuga(a))}. ${ROUTE_ASK[route]}`;
