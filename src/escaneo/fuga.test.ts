import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFuga, parseChannel, parseStore, routeLead } from "./fuga.ts";

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
