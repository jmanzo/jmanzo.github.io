export const SITE = {
  title: "Jean Manzo",
  description:
    "I find where Shopify stores doing $50k–$500k/mo leak revenue — and I fix it. Revenue Leak Audit delivered in 72 hours.",
  author: "Jean Manzo",
  url: "https://jmanzo.github.io",
} as const;

/**
 * Single source of truth for the offer on the site.
 * Prices mirror NEGOCIO.md. Never publish the $250 closing concession.
 */
export const OFFER = {
  name: "Revenue Leak Audit",
  price: 500,
  currency: "USD",
  turnaround: "72 hours",
  promise:
    "I show you exactly where your store leaks money, what each leak is worth, and which one to fix first.",
  guarantee:
    "If the leaks I find don't add up to at least 5x what you paid me in projected annual revenue, you don't pay.",
  bookingUrl: "https://calendly.com/jdevmanzo-1/30min",
  bookingLabel: "Book a 30-min call",
} as const;

export const SOCIAL_ICONS = ["github", "linkedin", "x"] as const;
export type SocialIconName = (typeof SOCIAL_ICONS)[number];

export const SOCIALS: ReadonlyArray<{
  label: string;
  href: string;
  icon: SocialIconName;
}> = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/jdevmanzo",
    icon: "linkedin",
  },
  { label: "X", href: "https://x.com/jdevmanzo", icon: "x" },
  { label: "GitHub", href: "https://github.com/jmanzo", icon: "github" },
];

export const NAV = [
  { label: "Audit", href: "/audit/" },
  { label: "Work", href: "/work/" },
  { label: "Writing", href: "/blog/" },
  { label: "About", href: "/about/" },
] as const;
