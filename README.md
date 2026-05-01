# jeanmanzo.com

Personal site of [Jean Manzo](https://jeanmanzo.com) — a content-first portfolio and blog migrated from WordPress to [Astro](https://astro.build/) and deployed to GitHub Pages.

## Stack

- [Astro 6](https://astro.build/) (static output) with [MDX](https://mdxjs.com/) and [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Tailwind CSS 4](https://tailwindcss.com/) via the official Vite plugin
- [Sharp](https://sharp.pixelplumbing.com/) powers Astro's image service (WebP/AVIF, responsive variants)
- Type-safe content collections (`blog`, `work`) defined in `src/content.config.ts`
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
├── public/                 # Static assets served as-is (favicon, etc.)
├── scripts/
│   └── migrate-wp.mjs      # WordPress → Markdown migration (idempotent)
├── src/
│   ├── assets/
│   │   └── blog/<slug>/    # Post images, optimized at build time by Astro
│   ├── components/         # Astro components (Header, Footer, SocialIcon, ...)
│   ├── content/
│   │   ├── blog/           # Blog posts (Markdown / MDX)
│   │   └── work/           # Work entries (Markdown / MDX)
│   ├── content.config.ts   # Zod schemas for both collections
│   ├── consts.ts           # SITE / SOCIALS / NAV constants
│   ├── layouts/Base.astro  # Shared HTML shell, head meta, fonts
│   ├── pages/              # File-based routes
│   │   ├── blog/[...slug].astro
│   │   ├── work/[...slug].astro
│   │   ├── rss.xml.ts
│   │   └── ...
│   └── styles/global.css   # Tailwind theme tokens + small BEM rules
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Conventions

- **Brand color**: `#019add` is exposed as `--color-brand` in `src/styles/global.css` and aliased to `--color-accent`. Always reference tokens via `var(--color-*)`, never hard-code colors in components.
- **CSS**: BEM (`block__element--modifier`) for any custom rules; Tailwind utilities for everything else.
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

Pushes to `main` trigger `.github/workflows/deploy.yml`, which runs `pnpm install --frozen-lockfile && pnpm run build` on Node 22 and publishes `./dist` to GitHub Pages. The site is served at <https://jmanzo.github.io> and proxied behind <https://jeanmanzo.com>.
