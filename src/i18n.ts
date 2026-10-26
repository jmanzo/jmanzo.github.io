import { CAREER, NAV, SITE, yearsSince } from "./consts";

/**
 * Site chrome per language. English is the whole site. Spanish is, for now,
 * only the lane the outreach lead magnet lives in, so its header and footer
 * link nowhere outside that lane (docs/backlog/sitio-en-espanol.md).
 */
export type Lang = "en" | "es";

export const langOf = (locale: string | undefined): Lang =>
  locale === "es" ? "es" : "en";

type Link = { label: string; href: string };

export const UI: Record<
  Lang,
  {
    role: string;
    description: string;
    ogLocale: string;
    home: string;
    nav: ReadonlyArray<Link>;
    cta: Link;
    footerLinks: ReadonlyArray<Link>;
  }
> = {
  en: {
    role: SITE.role,
    description: SITE.description,
    ogLocale: "en_US",
    home: "/",
    nav: NAV,
    cta: { label: "Get in touch", href: "#contact" },
    footerLinks: [],
  },
  es: {
    role: "Desarrollador senior",
    description: `Desarrollador senior. ${yearsSince(CAREER.developerSince)} años construyendo para la web, ${yearsSince(CAREER.shopifySince)} de ellos dentro de Shopify: apps, automatizaciones y tiendas.`,
    ogLocale: "es_LA",
    home: "/es/operar-a-mano/",
    nav: [],
    cta: { label: "Calcular mi costo", href: "/es/operar-a-mano/#escaneo" },
    footerLinks: [{ label: "Privacidad", href: "/es/privacidad/" }],
  },
};
