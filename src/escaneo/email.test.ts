import { test } from "node:test";
import assert from "node:assert/strict";
import { resultEmail } from "./email.ts";
import type { Answers } from "./fuga.ts";

const answers: Answers = {
  store: { kind: "url", url: "https://luna.co", host: "luna.co" },
  orders: "10-24",
  payments: ["cod"],
  hoursPerDay: 2.5,
  cod: { rejectedPerTen: 2, returnCost: 9000 },
};
const finding = { id: "script-tags", severity: 90, title: "2 apps cargan con script tags", detail: "..." };

test("resultEmail carries the headline and the math the result page shows", () => {
  const email = resultEmail({ answers, platform: "shopify", route: "comprobacion", findings: [finding], ctaUrl: "https://x/api/go?r=1" });
  assert.equal(email.titular, "75 horas al mes");
  assert.equal(email.plata, "y 918.000 al mes en envíos que vuelven");
  assert.equal(email.base, "Con 17 pedidos por día, 2,5 horas diarias, 2 de cada 10 rechazados a 9.000 cada envío.");
  assert.deepEqual(
    email.desglose.map((s) => s.titulo),
    ["Tiempo", "Contraentrega"],
  );
  assert.deepEqual(email.desglose[0].filas[0], { calculo: "2,5 horas al día × 30 días", total: "75 horas al mes" });
  assert.equal(email.sin_hallazgos, null);
  assert.equal(email.ruta_cta, "Quiero mi Comprobación");
  assert.equal(email.ruta_primero, null);
  assert.equal(email.ruta_url, "https://x/api/go?r=1");
});

test("resultEmail names the worst finding only on the email route", () => {
  const email = resultEmail({ answers: { ...answers, orders: "5-9" }, platform: "shopify", route: "email", findings: [finding], ctaUrl: "" });
  assert.equal(email.ruta_primero, "2 apps cargan con script tags");
});

test("resultEmail explains an empty findings list", () => {
  const email = resultEmail({
    answers: { ...answers, payments: ["card"], cod: undefined },
    platform: "none",
    route: "espera",
    findings: [],
    ctaUrl: "",
  });
  assert.equal(email.plata, null);
  assert.match(email.sin_hallazgos!, /Instagram/);
  assert.match(email.ruta_texto, /Instagram/);
});
