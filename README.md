# jeanmanzo.com

Personal site of [Jean Manzo](https://jeanmanzo.com), senior developer: portfolio, writing and contact. Built with [Astro](https://astro.build/) and served from Cloudflare.

The visual design comes from the retired `cro-free-tier-lp` landing: same tokens, type and components, extended to a multi-page site.

## Stack

- [Astro 6](https://astro.build/) (static output) with [MDX](https://mdxjs.com/) and [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- Plain CSS with design tokens in `src/styles/global.css`. No CSS framework.
- Montserrat (display), Roboto (body) and IBM Plex Mono (labels, code) from Google Fonts
- [Sharp](https://sharp.pixelplumbing.com/) powers Astro's image service (WebP/AVIF, responsive variants)
- Type-safe content collections (`blog`, `work`, `projects`) defined in `src/content.config.ts`
- pnpm + Node `>=22.12.0` (see `.nvmrc`)

## Commands

All commands run from the project root.

| Command            | Action                                            |
| :----------------- | :------------------------------------------------ |
| `pnpm install`     | Install dependencies                              |
| `pnpm dev`         | Start the local dev server at `localhost:4321`    |
| `pnpm build`       | Build the production site to `./dist/`            |
| `pnpm preview`     | Preview the production build locally              |
| `pnpm migrate:wp`  | Re-pull and convert posts from `jeanmanzo.com`    |
| `pnpm astro ...`   | Run any Astro CLI command (e.g. `astro check`)    |

## Project structure

```text
.
├── public/                 # Served as-is: favicon, og.png, robots.txt, _headers, _redirects
├── scripts/
│   └── migrate-wp.mjs      # WordPress → Markdown migration (idempotent)
├── src/
│   ├── assets/
│   │   └── blog/<slug>/    # Post images, optimized at build time by Astro
│   ├── components/         # Header, Footer, Section, PageHead, WorkEntry, Closer, SocialIcon
│   ├── content/
│   │   ├── blog/           # Blog posts (Markdown / MDX)
│   │   ├── work/           # Work entries (Markdown / MDX)
│   │   └── projects/       # Portfolio projects (Markdown / MDX), images in src/assets/projects/
│   ├── content.config.ts   # Zod schemas for both collections
│   ├── consts.ts           # SITE / CAREER / CONTACT / SOCIALS / NAV constants
│   ├── layouts/Base.astro  # Shared HTML shell, head meta, fonts
│   ├── pages/              # File-based routes
│   │   ├── blog/[...slug].astro
│   │   ├── work/[...slug].astro
│   │   ├── rss.xml.ts
│   │   └── ...
│   └── styles/global.css   # Design tokens, components, article prose
├── scripts/og-image.html   # Source of public/og.png (open it, click download)
├── wrangler.jsonc          # Cloudflare static-assets Worker config
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Conventions

- **Colors**: every color is a token on `:root` in `src/styles/global.css` (`--ground`, `--surface`, `--ink`, `--ink-2`, `--signal`, ...), redefined for dark mode under `prefers-color-scheme` and under `data-theme="dark"` / `data-theme="light"` on `<html>`. Components never hard-code colors. `--signal` is Pantone Blue C (`#0082c9`).
- **Layout**: sections use the landing's split pattern (`Section.astro`: heading on the left rail, content on the right). Inner pages open with `PageHead.astro`; every page ends with `Closer.astro` (`#contact`), which is where the nav's "Get in touch" button jumps.
- **Years of experience**: never typed by hand. `CAREER` in `src/consts.ts` holds the start years; `<Years since={...} />` renders the count at build time and a small script in `Base.astro` refreshes it in the browser, so it rolls over on January 1 without a deploy.
- **External links** open in a new tab. In `.astro` files set `target="_blank" rel="noopener noreferrer"` by hand; Markdown/MDX content gets it automatically from `src/plugins/rehype-external-links.mjs`.
- **Contact**: one real destination, `CONTACT.bookingUrl` in `src/consts.ts`. Every other contact CTA is an anchor to `#contact`.
- **Copy**: US English. No em dashes or en dashes in site copy; ranges are written "2024 to 2025". Claims on the site must be ones you can back up.
- **TypeScript**: no `as` assertions and no `any` — use union types, narrowing, and Zod schemas.
- **Content collections**:
  - `blog` posts require `title`, `description`, `pubDate`; optional `updatedDate`, `tags`, `draft`.
  - `work` entries require `title`, `description`, `year`; optional `role`, `url`, `stack`, `order` (higher = listed first).
  - A `work` entry that sets `url` is treated as a pointer (external link or internal route); no detail page is generated for it. Body content is rendered only for entries without `url`.

## Adding content

### A new blog post

Create `src/content/blog/<slug>.md` with frontmatter:

```md
---
title: "Post title"
description: "One-line summary used in lists and meta tags."
pubDate: 2026-05-01
tags: ["shopify", "cro"]
---

Body in Markdown / MDX.
```

### A new work entry

Create `src/content/work/<slug>.md` with frontmatter. Two flavors:

- **Project page** — omit `url`. The body is rendered at `/work/<slug>/`.
- **Pointer** — set `url` to an external URL or to `/blog/<slug>/`. No detail page is generated.

```md
---
title: "Project name"
description: "What it is and why it matters."
year: "2025"
url: "/blog/some-case-study/"   # optional
stack: ["TypeScript", "Shopify"]
order: 75
---
```

## Images

Inline post images live under `src/assets/blog/<slug>/`. Reference them from markdown with a relative path so Astro processes them through its image service:

```md
![Caption](../../assets/blog/<slug>/screenshot.png)
```

At build time Astro emits content-hashed WebP/AVIF variants under `/_astro/`, plus the right `width`/`height` attributes — no extra components needed.

## Migrating from WordPress

`scripts/migrate-wp.mjs` pulls every post from `https://jeanmanzo.com/wp-json/wp/v2/posts`, converts the HTML body to Markdown with [`turndown`](https://github.com/mixmark-io/turndown), maps WP categories to readable tag slugs, and writes one `.md` per slug into `src/content/blog/`. Inline images hosted on the WP site are downloaded into `src/assets/blog/<slug>/` (stripping WordPress's `-WIDTHxHEIGHT` resize suffix to fetch the originals) and the markdown is rewritten to use the local relative paths. The script is idempotent — re-running overwrites markdown files and skips images that already exist on disk.

```sh
pnpm migrate:wp
```

## Deployment

**Cloudflare**, as a static-assets Worker (the same setup the `cro-free-tier-lp` landing used). Configuration lives in `wrangler.jsonc`; there is no "Build output directory" field in the dashboard, that's Pages.

In the Cloudflare dashboard, under **Settings → Build**:

- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: empty (the repo root)

What ships with the build, from `public/`:

- `_headers`: security headers, plus immutable caching for the fingerprinted `/_astro/*` files.
- `_redirects`: 301s from the retired CRO URLs (`/free-tier`, `/audit`) to the home page.
- `robots.txt`: allows everyone and declares `Content-Signal: search=yes, ai-train=no, use=reference`.
- `og.png`: the default link preview card. Regenerate it with `scripts/og-image.html`.

Cloudflare turns on a setting by default that **prepends its own robots.txt**, blocking ClaudeBot, GPTBot, Google-Extended and others, which makes the site invisible to AI assistants. Change it under **Security Settings → Bot traffic → Manage your robots.txt** to **Content Signals Policy**, or to off.

### Domains

`jeanmanzo.com` and `www.jeanmanzo.com` are Custom Domains on the `jeanmanzo` Worker. In the `jeanmanzo.com` zone, **Always Use HTTPS** is on and a Redirect Rule sends `www` to the root with a 301. Every push to `main` builds and deploys automatically; the preview URL is `jeanmanzo.jean-manzo.workers.dev`.
