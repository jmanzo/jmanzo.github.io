/**
 * Career start years. Every "N years" on the site is derived from these, so
 * the numbers never need editing by hand.
 */
export const CAREER = {
  developerSince: 2012,
  shopifySince: 2019,
} as const;

/** Whole years from `since` to today (to build time, when rendered statically). */
export const yearsSince = (since: number) => new Date().getFullYear() - since;

const devYears = yearsSince(CAREER.developerSince);
const shopifyYears = yearsSince(CAREER.shopifySince);

export const SITE = {
  title: "Jean Manzo",
  description: `Senior developer. ${devYears} years building for the web, ${shopifyYears} of them inside Shopify: custom apps, theme app extensions, Liquid themes and Plus builds.`,
  author: "Jean Manzo",
  role: "Senior Developer",
  location: "Medellín, Colombia",
  url: "https://jeanmanzo.com",
} as const;

/**
 * The one real contact destination. Every other "Get in touch" on the site is
 * an anchor jump to the closer block (#contact), which links here.
 */
export const CONTACT = {
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
  { label: "GitHub", href: "https://github.com/jmanzo", icon: "github" },
  { label: "X", href: "https://x.com/jdevmanzo", icon: "x" },
];

export const NAV = [
  { label: "Work", href: "/work/" },
  { label: "Writing", href: "/blog/" },
  { label: "About", href: "/about/" },
] as const;

// Frontmatter dates are parsed as UTC midnight. Formatting them in the local
// zone shifts every post back a day anywhere west of Greenwich.
export const formatMonth = (date: Date) =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });

export const formatDay = (date: Date) =>
  date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
