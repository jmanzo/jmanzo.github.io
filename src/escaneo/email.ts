/**
 * The email with the full result (lead-magnets.md, "Klaviyo en la versión 1").
 * Klaviyo's flow starts from the unlock event and renders
 * worker/emails/resultado.html, which only prints these fields: every word of
 * the copy is written here, the same helpers the result page uses.
 */

import { fugaBreakdown, fugaHeadline, noFindingsText, routeCopy, type Answers, type Platform, type Route } from "./fuga.ts";
import type { Finding } from "./hallazgos.ts";

export type EmailInput = {
  answers: Answers;
  platform: Platform;
  route: Route;
  /** Sorted worst first, as findHallazgos returns them. */
  findings: Finding[];
  /** The /api/go link that opens Jean's WhatsApp with the result's ID. */
  ctaUrl: string;
};

/** The event properties the template reads, flat so the template stays simple. */
export function resultEmail({ answers, platform, route, findings, ctaUrl }: EmailInput) {
  const headline = fugaHeadline(answers);
  const offer = routeCopy(route, platform);
  return {
    titular: headline.hours,
    plata: headline.money,
    base: headline.basis,
    desglose: fugaBreakdown(answers).map((s) => ({
      titulo: s.title,
      filas: s.rows.map(([calculo, total]) => ({ calculo, total })),
    })),
    sin_hallazgos: findings.length ? null : noFindingsText(platform),
    ruta_titulo: offer.title,
    ruta_texto: offer.body,
    // Under 10 orders a day the offer is CRO or development, so it names
    // where Jean would start: the worst finding.
    ruta_primero: route === "email" && findings.length ? findings[0].title : null,
    ruta_cta: offer.cta,
    ruta_url: ctaUrl,
  };
}
