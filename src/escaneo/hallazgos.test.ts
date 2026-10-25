import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectPlatform,
  externalScriptHosts,
  findHallazgos,
  freeShippingThreshold,
  parseAmount,
  scriptTagUrls,
  type Product,
} from "./hallazgos.ts";

const loader = `<script>(function() {
  function asyncLoad() {
    var urls = ["https:\\/\\/reviews.example.io\\/w.js?shop=t.myshopify.com","https:\\/\\/upsell.example.com\\/u.js?shop=t.myshopify.com"];
    for (var i = 0; i < urls.length; i++) {}
  }
})();</script>`;

const product = (title: string, price: string, compare: string | null = null): Product => ({
  handle: title.toLowerCase(),
  title,
  variants: [{ price, compare_at_price: compare, available: true }],
});

test("detectPlatform spots Shopify from its CDN", () => {
  assert.equal(detectPlatform('<link href="//cdn.shopify.com/s/files/x.css">'), "shopify");
  assert.equal(detectPlatform("<html>woocommerce</html>"), "other");
});

test("scriptTagUrls reads the asyncLoad loader", () => {
  assert.deepEqual(scriptTagUrls(loader), [
    "https://reviews.example.io/w.js?shop=t.myshopify.com",
    "https://upsell.example.com/u.js?shop=t.myshopify.com",
  ]);
  assert.deepEqual(scriptTagUrls("<html></html>"), []);
});

test("externalScriptHosts skips Shopify and the store itself", () => {
  const html = `${loader}
    <script src="https://cdn.shopify.com/a.js"></script>
    <script src="//www.tienda.com/b.js"></script>
    <script src="/local.js"></script>
    <script async src="https://www.googletagmanager.com/gtm.js"></script>`;
  assert.deepEqual(externalScriptHosts(html, "tienda.com"), [
    "googletagmanager.com",
    "reviews.example.io",
    "upsell.example.com",
  ]);
});

test("parseAmount reads both decimal conventions", () => {
  assert.equal(parseAmount("150.000"), 150000);
  assert.equal(parseAmount("150,000"), 150000);
  assert.equal(parseAmount("1.299,90"), 1299.9);
  assert.equal(parseAmount("49.99"), 49.99);
  assert.equal(parseAmount("200"), 200);
  assert.equal(parseAmount("abc"), null);
});

test("freeShippingThreshold needs a currency amount next to the promise", () => {
  assert.equal(freeShippingThreshold("<div>Envío gratis por compras desde <b>$150.000</b></div>"), 150000);
  assert.equal(freeShippingThreshold("<p>Envíos gratis en 24 horas</p>"), null);
  assert.equal(freeShippingThreshold("<p>Spend more to earn free shipping! Shipping $5.00</p>"), null);
  assert.equal(freeShippingThreshold("<p>Free shipping on orders over $75</p>"), 75);
});

test("findHallazgos ranks the worst finding first", () => {
  const html = `${loader}<script src="//cdn.shopify.com/x.js"></script>
    <div class="bar">ENVÍO GRATIS desde $100.000</div><a href="https://wa.me/57300">WhatsApp</a>`;
  const products = [
    product("A", "120000.00"),
    product("B", "150000.00"),
    product("C", "90000.00", "90000.00"),
    product("D", "200000.00"),
    product("E", "110000.00"),
  ];
  const found = findHallazgos({ html, storeHost: "tienda.com", platform: "shopify", products });
  assert.deepEqual(found.map((f) => f.id), ["script-tags", "free-shipping", "compare-at", "whatsapp"]);
  assert.match(found[0].title, /^2 apps de tu tienda cargan/);
  assert.match(found[1].title, /^El 80%/);
});

test("the WhatsApp signal needs a chat link or a widget", () => {
  const ids = (html: string) => findHallazgos({ html, storeHost: "t.com", platform: "other", products: null }).map((f) => f.id);
  assert.deepEqual(ids('<a href="https://api.whatsapp.com/send?phone=57">Chat</a>'), ["whatsapp"]);
  assert.deepEqual(ids('<script src="https://cdn.x.io/whatsapp-button.js"></script>'), ["whatsapp"]);
  assert.deepEqual(ids("<p>Compártelo por WhatsApp</p>"), []);
});

test("findHallazgos skips Shopify-only findings elsewhere", () => {
  const found = findHallazgos({ html: loader, storeHost: "tienda.com", platform: "other", products: null });
  assert.deepEqual(found, []);
});
