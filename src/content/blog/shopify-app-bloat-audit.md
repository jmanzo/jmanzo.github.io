---
title: "Shopify App Bloat: The Monthly Bill and the Code That Outlives It"
description: "Uninstalled Shopify apps can leave code running in your theme, and some paid apps duplicate native features. A four-step audit to find leftovers and cut costs."
pubDate: 2026-10-04
tags: ["shopify", "apps", "liquid", "performance", "theme-development"]
heroImage: "../../assets/blog/shopify-app-bloat-audit/hero.png"
heroImageAlt: "Card titled You uninstalled the app, Its code didn't leave, with four audit steps: map every script, grep the theme, check App embeds, price it vs native"
draft: false
---

In June 2025 a merchant opened a Shopify Community thread titled "The price of apps is completely out of control." Their examples: an app for a trade-in feature at $599 a month, and "an app that would just add a few options to sort collections" at $299 a month. Their idea of a fair price: "$5 to $10 a month for a feature that shopify should have provided for free."

That's one merchant's report, not an industry average. But anyone who has opened Settings > Apps with a client has seen the shape of it: a long list of subscriptions, and a few of them doing things the theme or a free Shopify app already does.

The bill is the half you can see. The other half is code that keeps loading after you stop paying.

## Why uninstalling doesn't always uninstall

There are two generations of Shopify apps, and they leave very different footprints.

**Older apps wrote into your theme.** They used the Asset API to drop a file into `snippets/`, then edited `theme.liquid` or a section to call it with `{% render 'some-app-widget' %}`. Others asked you to paste a `<script>` tag into the layout during onboarding. Shopify's own Help Center is blunt about the result: "Some apps add code to your online store theme that isn't automatically removed when you uninstall the app." Uninstalling revokes the app's access. It doesn't rewrite your theme files. The snippet stays, the render call stays, and if that code loads a script from the vendor's server, your customers keep downloading it.

**Modern apps use theme app extensions.** App blocks and app embed blocks live inside the app, not in your theme files. Shopify's docs state that when merchants uninstall an app, "blocks associated with the apps are automatically and entirely removed from online store themes." This is the cleanup model you want, and it's why Shopify tells App Store developers to use theme app extensions instead of editing theme code.

A real example of the failure mode: in March 2025 a merchant posted that they had run a theme split test with an app, uninstalled it from the Shopify admin, and "the store is still diverting half traffic to the other old theme even after uninstall." Replies pointed at leftover code in `theme.liquid`. The thread has no confirmed fix, so I won't claim the root cause. But the lesson holds: uninstalling cancels future billing (you may still be charged for the current cycle), not necessarily behavior.

## The deadline that makes this audit timely

Script tags are the third way older apps load JavaScript: the ScriptTag API tells Shopify to inject a script on every storefront page, with nothing in your theme files to grep for. Shopify is ending them:

- **October 1, 2026:** apps can no longer create or update script tags. Existing ones keep running.
- **March 1, 2027:** Shopify stops injecting script tags into storefronts.

If an app you pay for still depends on a script tag, the feature stops loading on March 1, 2027 unless the developer moves it to an app embed block (or a web pixel, if it only tracks). Shopify's docs also warn that while both exist, "a script tag and its replacement running at the same time will load your script twice." Double-counted analytics, UI rendered twice. Worth asking every vendor on your list where they stand.

## The audit: four steps

Duplicate your live theme before touching anything. Every removal below happens on the copy, gets previewed, then gets published.

### 1. Map every script to an app you still use

Open the storefront in a private window, open DevTools, and paste this into the console after the page finishes loading:

```js
const urls = performance.getEntriesByType('resource').map((e) => e.name);
const hosts = [...new Set(urls.map((u) => new URL(u).hostname))].sort();
console.table(hosts);
// Theme app extension assets usually load from Shopify's CDN with /extensions/ in the path
console.table(urls.filter((u) => u.includes('/extensions/')));
```

Every host should map to an app on your Settings > Apps page or to a service you knowingly run (analytics, ad pixels). A host you can't map is a leftover candidate. Repeat on a product page and a collection page, since apps often load only where their feature appears.

### 2. Search the theme for orphans

Pull the live theme with Shopify CLI and run three checks:

```bash
shopify theme pull --live --path theme-audit
cd theme-audit

# Snippets nothing renders (some may be the theme's own dead code)
for f in snippets/*.liquid; do
  name=$(basename "$f" .liquid)
  grep -rqE "(render|include) ['\"]$name['\"]" layout sections snippets blocks templates 2>/dev/null \
    || echo "unused snippet: $name"
done

# Render calls pointing at snippets that no longer exist
grep -rhoE "(render|include) ['\"][^'\"]+['\"]" layout sections snippets blocks templates 2>/dev/null \
  | sed -E "s/.*['\"]([^'\"]+)['\"]/\1/" | sort -u \
  | while read -r s; do [ -f "snippets/$s.liquid" ] || echo "missing snippet: $s"; done

# Hardcoded external scripts in the layout
grep -nE "<script[^>]*src=" layout/*.liquid
```

An unused snippet with a vendor name in it is almost always an app leftover. A render call to a missing snippet means someone deleted half the integration, and it will print a Liquid error on the storefront. Then search for the names of apps you remember uninstalling: `grep -rni "vendorname" .` finds the ones that hid in `assets/` too.

### 3. Check app embeds in the theme editor

Go to Online Store > Themes > Customize and open App embeds in the sidebar. Every toggle that's on should belong to an app you still use. Shopify removes embeds when an app is uninstalled, so what you're hunting here is the opposite problem: apps still installed and billing, with an embed loading on every page, for a feature nobody uses anymore. Embeds are enabled per theme, so check the published one.

While you're in admin, check Settings > Customer events for custom pixels someone pasted in for a tool you've since dropped.

### 4. Price each remaining app against what's native

This is where the monthly bill shrinks. As of today, these are covered without a paid app:

- **Size charts:** a page reference metafield plus the theme's Pop-up block, connected as a dynamic source. Shopify's Help Center walks through exactly this.
- **Color swatches:** category metafields linked to variant options, rendered by the variant picker block in themes that support swatches.
- **Fixed bundles and multipacks:** Shopify Bundles, free, from Shopify.
- **Filters, search synonyms, boosts, related and complementary products:** Search & Discovery, free, from Shopify.
- **Newsletter popups and lead forms:** Shopify Forms, free, from Shopify.
- **Custom product badges:** a metafield and a few lines of Liquid in the product card, done once:

```liquid
{%- assign badge = card_product.metafields.custom.badge.value -%}
{%- if badge != blank -%}
  <span class="badge">{{ badge }}</span>
{%- endif -%}
```

- **Sticky add to cart:** some themes ship it as a setting. If yours doesn't, it's one section built once, not a subscription. I wrote up [a sticky CTA build for a 7-figure DTC brand](/blog/elevating-user-experience-with-a-sticky-cta-a-case-study-on-a-7-figure-dtc-e-commerce-brand/) if you want to see what that involves.

I won't pretend every expensive app is a theme setting in disguise. A real trade-in program has valuation logic, credit issuance and operations behind it, and some apps earn their fee. The question to ask of each line item is simpler: is this a monthly fee for a feature that, built once, would be finished?

## The rule I apply

Apps that own data or business logic you can't easily rebuild usually stay. Apps that inject UI the platform already gives you usually go. And any app that writes into your theme files gets a note in the repo saying exactly what it added, so uninstalling it later is a clean diff instead of an archaeology project.

If you'd rather have someone run this audit for you, that's the kind of work I do.

## Sources

- [Shopify Community: The price of apps is completely out of control (June 2025)](https://community.shopify.com/t/the-price-of-apps-is-completely-out-of-control/419098)
- [Shopify Community: Old app code still running after uninstall (March 2025)](https://community.shopify.com/t/urgent-old-app-code-still-running-after-uninstall/403717)
- [Shopify Help Center: Uninstalling apps](https://help.shopify.com/en/manual/apps/uninstalling-apps)
- [Shopify.dev: UX for theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/ux)
- [Shopify.dev: Migrate to theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/migrate)
- [Shopify.dev: Storefront script tags deprecation](https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation/storefront)
- [Shopify.dev: Shopify CLI theme pull](https://shopify.dev/docs/api/shopify-cli/theme/theme-pull)
- [Shopify Help Center: Adding a pop-up to your product pages with metafields](https://help.shopify.com/en/manual/custom-data/metafields/pop-up-tutorial)
- [Shopify Help Center: Using category metafields (swatches)](https://help.shopify.com/en/manual/custom-data/metafields/category-metafields/using-category-metafields)
- [Shopify Help Center: Shopify Bundles](https://help.shopify.com/en/manual/products/bundles/shopify-bundles)
- [Shopify App Store: Search & Discovery](https://apps.shopify.com/search-and-discovery)
- [Shopify App Store: Shopify Forms](https://apps.shopify.com/shopify-forms)
