/**
 * The unlock's contact form, checked the same way in the page and the Worker.
 * No DOM and no imports.
 */

export type Contact = {
  name: string;
  /** Digits only, with the country code (wa.me format). */
  whatsapp: string;
  email: string | null;
};

export const cleanName = (raw: string) => raw.trim().replace(/\s+/g, " ");

export const validName = (raw: string) => {
  const name = cleanName(raw);
  return name.length >= 2 && name.length <= 80;
};

/** "+57 300 123 4567" or "0057..." as "573001234567". Null unless 8 to 15 digits (E.164). */
export function whatsappDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").replace(/^00/, "");
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

/** Null when empty, false when it doesn't read as an email. */
export function emailOf(raw: string): string | null | false {
  const email = raw.trim().toLowerCase();
  if (!email) return null;
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/.test(email) ? email : false;
}

export function parseContact(raw: unknown): Contact | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === "string" && validName(r.name) ? cleanName(r.name) : null;
  const whatsapp = typeof r.whatsapp === "string" ? whatsappDigits(r.whatsapp) : null;
  const email = typeof r.email === "string" ? emailOf(r.email) : null;
  if (!name || !whatsapp || email === false) return null;
  return { name, whatsapp, email };
}

// Calling codes of the countries the outreach reaches. The country only
// segments the funnel; it is never asked.
const COUNTRIES: ReadonlyArray<[string, string]> = [
  ["593", "EC"], ["591", "BO"], ["595", "PY"], ["598", "UY"], ["507", "PA"],
  ["506", "CR"], ["502", "GT"], ["503", "SV"], ["504", "HN"], ["505", "NI"],
  ["57", "CO"], ["58", "VE"], ["52", "MX"], ["51", "PE"], ["56", "CL"],
  ["54", "AR"], ["55", "BR"], ["53", "CU"], ["34", "ES"], ["1", "+1"], // +1 is shared by the US, Canada, Dominican Republic and Puerto Rico.
];

/** The country from the WhatsApp prefix, or null when it isn't one of the above. */
export const countryOf = (whatsapp: string) =>
  COUNTRIES.find(([code]) => whatsapp.startsWith(code))?.[1] ?? null;
