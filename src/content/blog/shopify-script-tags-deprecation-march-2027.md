---
title: "Shopify script tags stop running March 1, 2027. Find yours now."
description: "Apps can no longer create or update Shopify script tags, and on March 1, 2027 they stop loading. How to find the ones your store runs and what replaces them."
pubDate: 2026-10-04
tags: ["shopify", "script-tags", "theme-app-extensions", "web-pixels", "shopify-apps"]
heroImage: "../../assets/blog/shopify-script-tags-deprecation-march-2027/hero.png"
heroImageAlt: "Card titled Script tags stop loading Mar 1, 2027, Find yours before then, with four points: frozen Oct 1, find them, ask vendors, migrate"
draft: false
---

Since October 1, 2026, `scriptTagCreate` and `scriptTagUpdate` return an error. On every API version. Pinning your app to an old version doesn't buy you anything.

The tags that already exist keep running. That's the dangerous part. Nothing on your storefront looks different today. The reviews widget loads, the upsell popup opens, the tracking script fires. Then on March 1, 2027, Shopify stops injecting script tags into storefronts, and whatever still depends on one stops loading. No error in the admin. A feature that's just gone.

Here's what changed, how to find out if your store is exposed, and what the fix looks like on the app side.

## What actually changed, and what didn't

From Shopify's changelog (August 24, 2026) and the storefront script tags guide:

- **October 1, 2026:** `scriptTagCreate` and `scriptTagUpdate` return a user error. The `ScriptTag` REST resource rejects `POST` and `PUT`. This applies to all API versions, including older ones.
- **Until March 1, 2027:** existing script tags keep running.
- **March 1, 2027:** Shopify stops injecting script tags into storefronts.
- **Still working:** the `scriptTags` query and `scriptTagDelete`, so apps can audit and clean up.

It applies to every app that uses script tags with a `display_scope` of `online_store`, old or new, public or custom. A tag with `display_scope: all` also keeps loading on the storefront until March 1, 2027.

The Order status page is a separate, earlier deprecation and it's already done. New `order_status` and `all` script tags were blocked on February 1, 2025, they stopped running on the Order status page for Plus stores on August 28, 2025, and for every other store on August 26, 2026. If something broke on your Order status page in late August, that's why.

## My take: script tags were always the shortcut

A script tag lets an app put JavaScript on every page of your store without touching your theme and without you ever turning anything on. Convenient for the app. Bad for you: it doesn't show up in the theme editor, you can't switch it off per theme, and it loads whether or not you still use the feature.

Shopify shipped theme app extensions as the replacement in 2021. An app that still depends on a script tag five years later is telling you something about how actively it's maintained. Use this deadline to audit your whole app stack. The migration ticket is the small part.

## Step 1: find the script tags your storefront loads

The first instinct of a developer is to run the `scriptTags` query. It won't give a merchant the full picture: Shopify's docs say it returns **your app's** script tags. Run it with a custom app token and you see that custom app's tags, not the ones your reviews app created.

So for a store-wide audit, start from the storefront. Script tags are injected through `content_for_header`, which renders a small loader (an `asyncLoad` function) with a `urls` array holding every script tag URL. Paste this into the DevTools console on your live storefront:

```js
// Lists the URLs in Shopify's script tag loader on the current page
const loader = [...document.scripts].find((s) =>
  s.textContent.includes('asyncLoad')
);
const match = loader?.textContent.match(/var urls = (\[[^\]]*\])/);
console.log(match ? JSON.parse(match[1]) : 'No script tag loader found');
```

That loader is Shopify-generated markup, not a documented API, so if the snippet comes back empty, double-check by hand: View Source, search for `asyncLoad`. Script tag URLs also usually carry a `shop=yourstore.myshopify.com` query parameter, which makes them easy to spot in the Network tab.

One thing this deprecation does not touch: `<script>` tags hardcoded in your theme files (often left behind in `theme.liquid` by apps you uninstalled years ago). Those keep running. They're a separate cleanup, and worth doing while you're in there.

## Step 2: map every URL to an app

The domain in each URL almost always names the vendor. Match each one against the list of apps installed in your admin. For each match you now have one of three cases:

1. The app already ships an app embed or web pixel, and the script tag is a leftover.
2. The app still depends on the script tag.
3. You don't use the app anymore. Uninstall it.

## Step 3: what to ask your app vendors

Send each vendor in case 2 these four questions:

1. Does your app still load on my storefront through a script tag?
2. What replaces it, and does it ship before March 1, 2027?
3. Is it an app embed I need to turn on in the theme editor, and on which theme?
4. When the replacement is live, will you delete the old script tag so the code doesn't load twice?

Question 4 matters more than it looks. Shopify's guide warns that a script tag and its replacement running together load the script twice, which can double-count analytics events or render the app's UI twice.

## For app developers: the migration

**Audit with your own token, store by store.** The query below was validated against the current Admin GraphQL schema and needs `read_script_tags`:

```graphql
query ScriptTagAudit {
  scriptTags(first: 50) {
    nodes {
      id
      src
      displayScope
      createdAt
      updatedAt
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**If the script renders UI or changes behavior, move it to an app embed block** in a theme app extension. Embeds target `head` or `body`, work on vintage and Online Store 2.0 themes, and show up in the theme editor:

```liquid
<script src="{{ 'app.js' | asset_url }}" defer></script>

{% schema %}
{
  "name": "My app embed",
  "target": "body",
  "settings": []
}
{% endschema %}
```

The catch: app embeds are off until the merchant turns them on, and your app can't activate them itself. Send the merchant to the theme editor with a deep link (`/admin/themes/current/editor?context=apps&activateAppId={api_key}/{handle}`), then confirm it's active, either with `app.extensions()` from your embedded app or by reading the published theme's `config/settings_data.json` (needs `read_themes`). An embed is active per theme, so a theme switch means checking again.

**If the script only collects analytics or conversion data, use a web pixel.** No theme editor step for the merchant. Your app creates it with the `webPixelCreate` mutation, and the extension subscribes to standard events:

```js
import {register} from '@shopify/web-pixels-extension';

register(({analytics, settings}) => {
  analytics.subscribe('checkout_completed', (event) => {
    fetch('https://collector.example.com/events', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify({
        account: settings.accountID,
        order: event.data.checkout.order?.id,
        total: event.data.checkout.totalPrice?.amount,
      }),
    });
  });
});
```

**If it's a custom app created in the Shopify admin**, it can't use app extensions at all. Shopify's guidance is to move the script into the theme, using a custom Liquid block where possible.

**Order of operations:** ship the replacement, get it active, confirm, then `scriptTagDelete`. Delete first and the feature disappears until the merchant flips the embed on. Skip the delete and you load everything twice until March.

## The deadline that matters is not March

March 1, 2027 is when things break. The real deadline is earlier: the time your vendors need to ship, your team needs to turn on embeds, and somebody needs to check that analytics numbers didn't double. Run the console snippet this week. It takes two minutes.

If you'd rather have someone audit this for you, that's the kind of work I do.

## Sources

- [Script tags are deprecated and will stop running on March 1, 2027 (Shopify developer changelog)](https://shopify.dev/changelog/online-store-script-tags-deprecation)
- [Script tag deprecation (shopify.dev)](https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation)
- [Storefront script tags (shopify.dev)](https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation/storefront)
- [Order status script tags (shopify.dev)](https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation/order-status)
- [scriptTags query, GraphQL Admin API (shopify.dev)](https://shopify.dev/docs/api/admin-graphql/latest/queries/scriptTags)
- [Configure theme app extensions: app embed blocks and deep linking (shopify.dev)](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)
- [Migrate to theme app extensions (shopify.dev)](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/migrate)
- [Build web pixels (shopify.dev)](https://shopify.dev/docs/apps/build/marketing/build-web-pixels)
