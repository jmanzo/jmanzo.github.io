export const SITE = {
  title: "Jean Manzo",
  description:
    "Full-stack developer specializing in Shopify apps and themes. 10+ years building reliable e-commerce experiences.",
  author: "Jean Manzo",
  url: "https://jmanzo.github.io",
} as const;

export const SOCIAL_ICONS = ["github", "linkedin", "x"] as const;
export type SocialIconName = (typeof SOCIAL_ICONS)[number];

export const SOCIALS: ReadonlyArray<{
  label: string;
  href: string;
  icon: SocialIconName;
}> = [
  { label: "GitHub", href: "https://github.com/jmanzo", icon: "github" },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/jdevmanzo",
    icon: "linkedin",
  },
  { label: "X", href: "https://x.com/jdevmanzo", icon: "x" },
];

export const NAV = [
  { label: "Work", href: "/work/" },
  { label: "Blog", href: "/blog/" },
  { label: "About", href: "/about/" },
] as const;
