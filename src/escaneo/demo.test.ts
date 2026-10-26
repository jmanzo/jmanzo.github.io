import { test } from "node:test";
import assert from "node:assert/strict";
import { demoProducts, demoScript, formatMoney, scenesFor, storeBrand } from "./demo.ts";

test("storeBrand reads the name, currency and icon from a Shopify home page", () => {
  const html = `<head><title>Inicio | Tienda Luna</title>
    <meta property='og:site_name' content='Luna &amp; Sol'>
    <link rel="icon" type="image/png" href="//luna.co/cdn/shop/files/fav.png?v=1">
    <script>Shopify.currency = {"active":"COP","rate":"1.0"};</script></head>`;
  assert.deepEqual(storeBrand(html, "https://luna.co"), {
    name: "Luna & Sol",
    currency: "COP",
    icon: "https://luna.co/cdn/shop/files/fav.png?v=1",
  });
});

test("storeBrand falls back to the title, the logo image and the host", () => {
  const html = `<title>Tienda Luna – Ropa hecha a mano</title><img class="header__logo" src="/logo.png">`;
  assert.deepEqual(storeBrand(html, "https://www.luna.co"), { name: "Tienda Luna", currency: null, icon: "https://www.luna.co/logo.png" });
  assert.equal(storeBrand("", "https://www.luna.co").name, "luna.co");
});

test("demoProducts keeps available products with a price and their first image", () => {
  const products = [
    { handle: "a", title: "Agotado", variants: [{ price: "10", compare_at_price: null, available: false }] },
    { handle: "b", title: "Gratis", variants: [{ price: "0", compare_at_price: null }] },
    { handle: "c", title: "Bolso", variants: [{ price: "129900.00", compare_at_price: null }], images: [{ src: "https://cdn/x.jpg" }] },
  ];
  assert.deepEqual(demoProducts(products), [{ title: "Bolso", price: 129900, image: "https://cdn/x.jpg" }]);
  assert.deepEqual(demoProducts(null), []);
});

test("formatMoney writes each currency the way its merchants do", () => {
  assert.equal(formatMoney(129900, "COP"), "$ 129.900");
  assert.equal(formatMoney(49.9, "PEN"), "S/ 49.90");
  assert.equal(formatMoney(12, null), "$12");
});

test("scenesFor matches the modules the merchant's payments need", () => {
  assert.deepEqual(scenesFor(["cod", "proof"]), ["cod", "proof"]);
  assert.deepEqual(scenesFor(["wallet"]), ["proof"]);
  assert.deepEqual(scenesFor(["card"]), ["cod"]);
});

test("demoScript confirms the order, answers free text and checks the proof", () => {
  const msgs = demoScript({
    brand: { name: "Luna", currency: "COP" },
    product: { title: "Bolso", price: 129900, image: null },
    customer: "María",
    carrier: "Coordinadora",
    scenes: ["cod", "proof"],
  });
  assert.deepEqual(
    msgs.map((m) => `${m.from}:${m.kind}`),
    ["store:text", "store:order", "client:tap", "client:text", "store:text", "store:text", "system:divider", "client:text", "client:receipt", "store:text"],
  );
  const last = msgs.at(-1)!;
  assert.ok(last.kind === "text" && last.text.includes("$ 129.900"));
  assert.ok(msgs.some((m) => m.kind === "text" && m.text.includes("Coordinadora")));
});
