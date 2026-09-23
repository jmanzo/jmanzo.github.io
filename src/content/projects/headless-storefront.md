---
title: "Block library for a headless sleep-tech storefront"
description: "Main developer on the V2 redesign of a headless Shopify storefront: a CMS-driven block library in Nuxt 3, rebuilt product pages, cart and a redesigned blog. Brand withheld; work done at Vaangroup."
tier: featured
order: 90
kind: "Agency work"
client: "Sleep-tech DTC brand (name withheld)"
engagement: "Through Vaangroup, a Shopify Plus agency"
role: "Senior developer, main developer on the V2 redesign"
period: "2025–2026"
status: "In production"
stack: ["Nuxt 3", "Vue 3", "TypeScript", "Headless CMS", "Shopify Storefront API", "GraphQL Codegen", "Pinia", "Tailwind CSS", "Vitest"]
cover: "../../assets/projects/headless-storefront.svg"
coverAlt: "Diagram: headless CMS and Shopify Storefront API feeding a Nuxt 3 block library that renders home, product, blog and cart pages"
---

## Context

A direct-to-consumer sleep-tech brand running a headless storefront: Nuxt 3 on the front, a headless CMS for content, and Shopify behind it through the Storefront API. I worked on it as a developer at Vaangroup, the Shopify Plus agency that maintained the site. The brand stays unnamed here; the work is described as it was.

The goal of the V2 redesign was to let the marketing team build pages without a developer: every section of the site becomes a typed block that editors compose in the CMS, and the Nuxt app renders whatever they assemble.

## What I built

**The V2 block library.** Most of the blocks the redesign runs on: fullscreen hero and fullscreen banner (with light and dark modes), switchable media, stats, content carousel and its card variants, stacking cards, FAQ, publications, static testimonial, paragraph, media item, title, button and prefooter cards. Each block has its CMS schema, its GraphQL query, generated types and its Vue component.

**Pages assembled from blocks.** Home and marketing pages, the V2 product page (FAQ, info-card carousel, stacking section, below-the-fold reviews, clinicians' recommendation) and the V2 cart.

**The blog redesign.** Hero banner with responsive video and image layers, navigation links, an article highlight carousel, carousel cards and a paginated article grid, then the production routes for the new blog.

**The unglamorous part.** Scroll-depth and carousel bugs, video autoplay timing, heading semantics for SEO, caching moved to session storage, and a pnpm migration fix.

## How the work ran

Ticket by ticket in a shared codebase with years of history, each change through its own pull request and a QA pass against the design. Most of my commits in that period are V2 blocks and the pages built from them.
