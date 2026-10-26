import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { KLAVIYO_METRIC, saveToKlaviyo, type Lead } from "./notify.ts";
import { computeFuga, type Answers } from "../src/escaneo/fuga.ts";

const answers: Answers = {
  store: { kind: "url", url: "https://luna.co", host: "luna.co" },
  orders: "lt5",
  payments: ["card"],
  hoursPerDay: 2,
};

const lead = (email: string | null): Lead => ({
  id: "abc123defg",
  url: "https://jeanmanzo.com/es/operar-a-mano/?r=abc123defg",
  contact: { name: "Ana Pérez", whatsapp: "573005550101", email },
  country: "CO",
  channel: null,
  answers,
  fuga: computeFuga(answers),
  platform: "shopify",
  route: "email",
  findings: [],
  consentAt: 1,
});

const env = { KLAVIYO_API_KEY: "test", KLAVIYO_LIST_ID: "L1" } as unknown as Env;

/** Records every Klaviyo call and answers each one like Klaviyo would. */
function mockKlaviyo() {
  const calls: { path: string; body: any }[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ path: url.replace("https://a.klaviyo.com/api/", ""), body: JSON.parse(String(init.body)) });
    return new Response(JSON.stringify({ data: { id: "P1" } }), { status: 200 });
  }) as typeof fetch;
  restore = () => (globalThis.fetch = real);
  return calls;
}
let restore = () => {};
afterEach(() => restore());

const events = (calls: { path: string; body: any }[]) =>
  calls.filter((c) => c.path === "events/" && c.body.data.attributes.metric.data.attributes.name === KLAVIYO_METRIC);

test("an unlock with email sends the event the result email flow starts from", async () => {
  const calls = mockKlaviyo();
  await saveToKlaviyo(env, lead("ana@luna.co"));
  const [event] = events(calls);
  assert.deepEqual(event.body.data.attributes.profile.data.attributes, { external_id: "wa:573005550101", email: "ana@luna.co" });
});

test("an unlock without email doesn't fire the email, even if the profile already has one", async () => {
  // The profile is matched by WhatsApp, so an earlier Escaneo's email would
  // get this result's email unless the event is left out.
  const calls = mockKlaviyo();
  await saveToKlaviyo(env, lead(null));
  assert.equal(events(calls).length, 0);
  // The profile is still updated with this Escaneo and joins the list.
  const profile = calls.find((c) => c.path === "profile-import/")!;
  assert.equal(profile.body.data.attributes.external_id, "wa:573005550101");
  assert.equal(profile.body.data.attributes.properties.escaneo_id, "abc123defg");
  assert.ok(calls.some((c) => c.path === "lists/L1/relationships/profiles/"));
});
