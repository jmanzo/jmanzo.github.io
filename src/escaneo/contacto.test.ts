import { test } from "node:test";
import assert from "node:assert/strict";
import { countryOf, emailOf, parseContact, whatsappDigits } from "./contacto.ts";

test("whatsappDigits keeps the country code and drops everything else", () => {
  assert.equal(whatsappDigits("+57 300 123 4567"), "573001234567");
  assert.equal(whatsappDigits("0058 (412) 555-0101"), "584125550101");
  assert.equal(whatsappDigits("1234"), null);
  assert.equal(whatsappDigits("0 300 123 4567"), null);
});

test("emailOf tells an empty field from a wrong one", () => {
  assert.equal(emailOf("  "), null);
  assert.equal(emailOf(" Ana@Tienda.co "), "ana@tienda.co");
  assert.equal(emailOf("ana@tienda"), false);
});

test("parseContact requires a name and a WhatsApp, and an email only if typed well", () => {
  const ok = { name: "  Ana   Pérez ", whatsapp: "+57 300 123 4567", email: "" };
  assert.deepEqual(parseContact(ok), { name: "Ana Pérez", whatsapp: "573001234567", email: null });
  assert.equal(parseContact({ ...ok, name: "A" }), null);
  assert.equal(parseContact({ ...ok, whatsapp: "300" }), null);
  assert.equal(parseContact({ ...ok, email: "ana@" }), null);
  assert.equal(parseContact(null), null);
});

test("countryOf reads the longest matching calling code", () => {
  assert.equal(countryOf("573001234567"), "CO");
  assert.equal(countryOf("584125550101"), "VE");
  assert.equal(countryOf("593991234567"), "EC");
  assert.equal(countryOf("18095551234"), "+1");
  assert.equal(countryOf("447700900123"), null);
});
