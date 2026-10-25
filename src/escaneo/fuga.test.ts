import { test } from "node:test";
import assert from "node:assert/strict";
import { arreglos, computeFuga, ctaText, fugaBreakdown, parseAnswers, parseChannel, parseStore, routeLead } from "./fuga.ts";

test("parseStore accepts a bare domain, a full URL and an Instagram handle", () => {
  assert.deepEqual(parseStore("Tienda.com"), { kind: "url", url: "https://tienda.com", host: "tienda.com" });
  assert.deepEqual(parseStore("https://www.tienda.co/products/x?y=1"), {
    kind: "url",
    url: "https://www.tienda.co",
    host: "www.tienda.co",
  });
  assert.deepEqual(parseStore(" @Mi.Tienda "), { kind: "instagram", handle: "mi.tienda" });
  assert.deepEqual(parseStore("instagram.com/mitienda"), { kind: "instagram", handle: "mitienda" });
  assert.equal(parseStore("no es una tienda"), null);
  assert.equal(parseStore("localhost"), null);
});

test("computeFuga uses only the merchant's answers", () => {
  const fuga = computeFuga({
    store: { kind: "instagram", handle: "x" },
    orders: "10-24",
    payments: ["cod", "card"],
    hoursPerDay: 3,
    cod: { rejectedPerTen: 2, returnCost: 9000 },
  });
  // 17 orders × 30 days × 20% rejected × 9,000 per return
  assert.deepEqual(fuga, { ordersPerDay: 17, hoursPerMonth: 90, moneyPerMonth: 918000 });
});

test("computeFuga has no money figure without contraentrega", () => {
  const fuga = computeFuga({
    store: { kind: "instagram", handle: "x" },
    orders: "lt5",
    payments: ["proof"],
    hoursPerDay: 1.5,
  });
  assert.equal(fuga.moneyPerMonth, null);
  assert.equal(fuga.hoursPerMonth, 45);
});

test("routeLead follows the lead table", () => {
  assert.equal(routeLead({ orders: "10-24" }, "shopify"), "comprobacion");
  assert.equal(routeLead({ orders: "50+" }, "other"), "espera");
  assert.equal(routeLead({ orders: "25-49" }, "none"), "espera");
  assert.equal(routeLead({ orders: "5-9" }, "shopify"), "email");
});

test("parseChannel keeps only known channels", () => {
  assert.equal(parseChannel("wa"), "wa");
  assert.equal(parseChannel("facebook"), null);
  assert.equal(parseChannel(null), null);
});

test("parseAnswers rejects what the form would never send", () => {
  const ok = { store: "tienda.com", orders: "10-24", payments: ["cod", "x"], hoursPerDay: 3, cod: { rejectedPerTen: 2, returnCost: 9000 } };
  assert.deepEqual(parseAnswers(ok), {
    store: { kind: "url", url: "https://tienda.com", host: "tienda.com" },
    orders: "10-24",
    payments: ["cod"],
    hoursPerDay: 3,
    cod: { rejectedPerTen: 2, returnCost: 9000 },
  });
  assert.equal(parseAnswers({ ...ok, orders: "100" }), null);
  assert.equal(parseAnswers({ ...ok, hoursPerDay: 30 }), null);
  assert.equal(parseAnswers({ ...ok, cod: { rejectedPerTen: 11, returnCost: 9000 } }), null);
  assert.equal(parseAnswers({ ...ok, payments: ["card"], cod: undefined })?.cod, undefined);
  assert.equal(parseAnswers("nope"), null);
});

test("ctaText carries the result ID only when there is one", () => {
  const a = parseAnswers({ store: "@tienda", orders: "5-9", payments: ["card"], hoursPerDay: 1 })!;
  assert.equal(
    ctaText(a, "abc123"),
    "Hola Jean, hice el Escaneo de operar a mano para @tienda (resultado abc123). Me sale que se me van 30 horas al mes. Quiero mi Comprobación.",
  );
  assert.ok(!ctaText(a).includes("resultado"));
});

test("ctaText asks for what the lead's route offers", () => {
  const a = parseAnswers({ store: "@tienda", orders: "5-9", payments: ["card"], hoursPerDay: 1 })!;
  assert.ok(ctaText(a, "abc123", "email").endsWith("Quiero saber qué arreglarías primero en mi tienda."));
  assert.ok(ctaText(a, "abc123", "espera").endsWith("Quiero pasar mi tienda a Shopify."));
});

test("fugaBreakdown shows the math with the merchant's own numbers", () => {
  const a = parseAnswers({
    store: "tienda.com",
    orders: "25-49",
    payments: ["cod"],
    hoursPerDay: 2.5,
    cod: { rejectedPerTen: 3, returnCost: 12000 },
  })!;
  const [time, cod] = fugaBreakdown(a);
  assert.deepEqual(time.rows[0], ["2,5 horas al día × 30 días", "75 horas al mes"]);
  assert.deepEqual(time.rows[1], ["75 horas ÷ 8 horas por jornada", "9 jornadas al mes"]);
  assert.deepEqual(cod.rows[1], ["3 de cada 10 rechazados", "333 envíos que vuelven"]);
  assert.deepEqual(cod.rows[2], ["333 × 12.000 por envío", "3.996.000 al mes"]);
  assert.equal(fugaBreakdown({ ...a, payments: ["card"], cod: undefined }).length, 1);
});

test("arreglos only lists the modules that apply to how the merchant gets paid", () => {
  const titles = (payments: Parameters<typeof arreglos>[0]["payments"]) => arreglos({ payments }).map((m) => m.title);
  assert.deepEqual(titles(["cod", "proof"]), ["Contraentrega", "Comprobantes", "Sincronización de pedidos"]);
  assert.deepEqual(titles(["wallet"]), ["Comprobantes", "Sincronización de pedidos"]);
  assert.deepEqual(titles(["card"]), ["Sincronización de pedidos"]);
});
