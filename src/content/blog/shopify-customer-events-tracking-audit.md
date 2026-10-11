---
title: "The 30-minute Shopify tracking audit: move the rest of the funnel to Customer Events"
description: "Purchase tracking got rebuilt. View item, add to cart and checkout steps often didn't. A 30-minute audit to move every tag to Shopify Customer Events."
pubDate: 2026-10-15
tags: ["shopify", "analytics", "web-pixels", "customer-events", "ga4", "google-tag-manager", "tracking"]
heroImage: "../../assets/blog/shopify-customer-events-tracking-audit/hero.png"
heroImageAlt: "Card titled 30-minute tracking audit: move the funnel to pixels, with four steps: baseline, inventory, map events, one owner"
draft: false
---

When Additional Scripts stopped running on the Thank you page, a lot of stores rebuilt exactly one event: purchase. That was the one that broke ROAS, so that was the one somebody fixed. I covered that check and the `checkout_completed` pixel in [the earlier piece on Thank you page tracking](https://jeanmanzo.com/blog/shopify-thank-you-page-tracking-additional-scripts/). Do that first if you haven't.

This piece is about everything above purchase. `view_item`, `add_to_cart`, `begin_checkout`, shipping and payment steps. On a lot of stores those still come from a GTM container pasted into `theme.liquid`, a `gtag` snippet from 2021, and two app pixels nobody remembers installing. `theme.liquid` doesn't render in checkout, so anything that lives there can't see the checkout steps at all. And whatever it does see, it may be sending twice.

Littledata, which sells server-side tracking, says that on average 20 out of every 100 Shopify orders never show up in GA4, and points at ad blockers, Safari's Intelligent Tracking Prevention and shoppers who leave the Thank you page early. It's a vendor number with no published method, so don't quote it to your boss as fact. Run the audit below and you'll have your own number, for your own funnel, in half an hour.

## Minutes 0 to 5: baseline the funnel

You need one view of what Shopify thinks happened and one of what your tools think happened. Shopify's side is a ShopifyQL query against the `sessions` schema:

```shopifyql
FROM sessions
  SHOW sessions, sessions_with_cart_additions,
    sessions_that_reached_checkout, sessions_that_completed_checkout
  WHERE human_or_bot_session = 'human'
  TIMESERIES day
  SINCE startOfDay(-30d) UNTIL today
  ORDER BY day ASC
```

On the GA4 side, build a free-form Exploration with Date and Event name as dimensions and Sessions as the metric, filtered to `add_to_cart`, `begin_checkout`, `add_shipping_info` and `add_payment_info`. Put the two side by side.

These will never match. Shopify counts its own sessions; GA4 counts sessions that sent the event and were allowed to by consent and the browser. You're reading shape, not reconciling:

- **A step that's zero or flat for days:** the tag behind it is dead. A theme update that dropped a snippet will do it.
- **A GA4 step well above Shopify's count for the same step:** two things are sending it. More on that in the last five minutes.
- **Healthy product and cart steps, nothing in checkout:** the funnel lives in the theme and never made it to Customer events.

For Meta, do the same in Events Manager with ViewContent, AddToCart, InitiateCheckout and AddPaymentInfo.

## Minutes 5 to 15: inventory every tag

Tags hide in three places. Write one row per tag: where it lives, which event it sends, which destination, and who owns it.

**1. Theme code.** Pull the live theme and grep for the usual suspects. The Google strings come straight from Google's own guide for removing duplicate tags on Shopify:

```bash
shopify theme pull --live --path tracking-audit
grep -rnoE "GTM-[A-Z0-9]+|AW-[0-9]+|gtag\(|dataLayer\.push|googletagmanager\.com|googleadservices\.com|fbq\(|connect\.facebook\.net" tracking-audit | sort -u
```

Anything in `layout/theme.liquid`, a snippet or a section is a candidate to move.

**2. The GTM container.** Open it and list every tag with its trigger. Pay attention to triggers built on DOM things: click classes, element visibility, form submits, URL matches on `/checkouts/`. Those are the ones that won't survive the move as-is.

**3. Settings > Customer events.** Open both the App pixels and Custom pixels lists. For each app pixel, click into it and check its data access setting. Since January 13, 2026, Shopify defaults marketing pixels to **Optimized**, which lets Shopify pause a pixel's data sharing when it doesn't see traffic or sales signals, and resume it later. Analytics app pixels stay **Always on**. If a marketing pixel's numbers dip with no code change, check this before you debug anything else.

Then confirm in the browser. Shopify's own migration guide suggests the simplest duplicate check there is: open DevTools, trigger one event, and look for more than one request to the same analytics endpoint.

## Minutes 15 to 25: map each tag to a standard event

Customer events is the merchant-facing side of the Web Pixels API. Instead of scraping the page, a pixel subscribes to events Shopify publishes. Fifteen standard events today:

| Funnel step | Web Pixels event | GA4 event | Meta (Facebook & Instagram app) |
|---|---|---|---|
| Any page | `page_viewed` | page_view | PageView |
| Product page | `product_viewed` | view_item | ViewContent |
| Collection page | `collection_viewed` | view_item_list | not sent |
| Search | `search_submitted` | search | Search |
| Add / remove | `product_added_to_cart`, `product_removed_from_cart` | add_to_cart, remove_from_cart | AddToCart (add only) |
| Cart page | `cart_viewed` | view_cart | not sent |
| Checkout | `checkout_started` | begin_checkout | InitiateCheckout |
| Contact, address | `checkout_contact_info_submitted`, `checkout_address_info_submitted` | none | not sent |
| Shipping | `checkout_shipping_info_submitted` | add_shipping_info | not sent |
| Payment | `payment_info_submitted` | add_payment_info | AddPaymentInfo |
| Purchase | `checkout_completed` | purchase | Purchase |

Plus `alert_displayed` and `ui_extension_errored`, which are worth subscribing to on their own: they tell you when a shopper sees an inline error or warning, or when a checkout extension crashes.

The GA4 names in that table are the ones Shopify's GTM tutorial and Google's docs for the Google & YouTube app use. Meta names are the events Shopify lists for the Facebook & Instagram pixel.

### What won't map

Pixels run sandboxed. App pixels run in a strict sandbox (a web worker, no DOM). Custom pixels run in a lax sandbox: an iframe with `allow-scripts` and `allow-forms` that can't reach the top frame. In practice:

- `window.location` gives you the sandbox URL, not the page. Read `event.context.document.location.href` instead.
- No DOM scraping. Scroll depth, outbound link clicks, heatmaps and "grab the price from `.product__price`" tags are dead.
- No UI. A pixel can't render a banner, a form or a modal.

For theme interactions you still care about, publish your own event from the theme with `Shopify.analytics.publish('newsletter_signup', { ... })` and subscribe to it in the pixel. The Web Pixels API also exposes DOM events like `clicked` and `form_submitted`.

### Consent is enforced, not optional

New custom pixels require Marketing and Analytics permission by default (the Customer privacy section of each pixel). In consent-required regions the pixel doesn't run until the visitor grants it. Pixels flagged as data sale don't run for visitors who opted out. Expect some numbers to drop after the move if your old theme tags ignored the banner. That drop is the old setup being wrong, not the new one.

## Can GTM run inside a custom pixel?

Yes. Shopify's Help Center has a full tutorial: paste the JavaScript from GTM's head snippet (no HTML) into a custom pixel, subscribe to Customer events, push them to `window.dataLayer`, and build GTM triggers on those event names.

Three things the tutorial is clear about, and people still miss:

1. Google Tag Assistant's Troubleshoot feature doesn't work with custom pixels, and Tag Assistant won't detect Google tags loaded inside one. Test with the Shopify Pixel Helper and the Network tab.
2. GA4 inside the sandbox reports sandbox page URLs. Turn off automatic page views and send `page_view` yourself from `page_viewed`.
3. The example code sets all four Consent Mode signals to `granted`. Don't paste that as-is. Map them from `init.customerPrivacy`, like below.

My opinion: GTM in a pixel is a bridge, not a destination. If your container only sends GA4 and Meta, the apps already do that. Keep GTM for the vendors that have no app.

## The pixel: the whole funnel into a dataLayer

This subscribes to the funnel events and pushes them in GA4's ecommerce shape. Field names are from the Web Pixels API reference: `productVariant`, `cartLine`, `cart`, `collection`, `searchResult` and `checkout`.

```js
// Settings > Customer events > Add custom pixel
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

// Consent Mode from Shopify's customer privacy state, not hardcoded
const consent = (p) => ({
  analytics_storage: p.analyticsProcessingAllowed ? 'granted' : 'denied',
  ad_storage: p.marketingAllowed ? 'granted' : 'denied',
  ad_user_data: p.marketingAllowed ? 'granted' : 'denied',
  ad_personalization: p.marketingAllowed ? 'granted' : 'denied',
});
gtag('consent', 'default', consent(init.customerPrivacy));
api.customerPrivacy.subscribe('visitorConsentCollected', (e) => {
  gtag('consent', 'update', consent(e.customerPrivacy));
});

const item = (v, quantity = 1) => ({
  item_id: v?.sku || v?.id,
  item_name: v?.product?.title,
  item_variant: v?.title,
  item_brand: v?.product?.vendor,
  price: v?.price?.amount,
  quantity,
});

const push = (name, event, payload = {}) => {
  dataLayer.push({ ecommerce: null }); // clear the previous ecommerce object
  dataLayer.push({
    event: name,
    event_id: event.id, // reuse as the dedup id if you also send server-side
    page_location: event.context.document.location.href, // real URL, not the sandbox
    ...payload,
  });
};

analytics.subscribe('page_viewed', (e) =>
  push('page_view', e, { page_title: e.context.document.title }));

analytics.subscribe('product_viewed', (e) => {
  const v = e.data.productVariant;
  push('view_item', e, { ecommerce: { currency: v.price.currencyCode, value: v.price.amount, items: [item(v)] } });
});

analytics.subscribe('collection_viewed', (e) => {
  const c = e.data.collection;
  push('view_item_list', e, { ecommerce: { item_list_id: c.id, item_list_name: c.title, items: c.productVariants.map((v) => item(v)) } });
});

analytics.subscribe('search_submitted', (e) =>
  push('search', e, { search_term: e.data.searchResult.query }));

analytics.subscribe('product_added_to_cart', (e) => {
  const line = e.data.cartLine;
  if (!line) return;
  push('add_to_cart', e, { ecommerce: { currency: line.cost.totalAmount.currencyCode, value: line.cost.totalAmount.amount, items: [item(line.merchandise, line.quantity)] } });
});

analytics.subscribe('cart_viewed', (e) => {
  const cart = e.data.cart;
  if (!cart) return;
  push('view_cart', e, { ecommerce: { currency: cart.cost.totalAmount.currencyCode, value: cart.cost.totalAmount.amount, items: cart.lines.map((l) => item(l.merchandise, l.quantity)) } });
});

const CHECKOUT_STEPS = {
  checkout_started: 'begin_checkout',
  checkout_shipping_info_submitted: 'add_shipping_info',
  payment_info_submitted: 'add_payment_info',
};
Object.entries(CHECKOUT_STEPS).forEach(([shopifyEvent, ga4Event]) => {
  analytics.subscribe(shopifyEvent, (e) => {
    const co = e.data.checkout;
    push(ga4Event, e, { ecommerce: { currency: co.currencyCode, value: co.totalPrice?.amount, items: co.lineItems.map((li) => item(li.variant, li.quantity)) } });
  });
});

// Optional: load your GTM container here with the JS from GTM's head snippet.
```

Purchase is left out on purpose. If an app pixel owns it, leave it there. If it doesn't, the earlier article has the `checkout_completed` pixel.

Test every add-to-cart path the theme has (product form, quick add, cart drawer upsell) in the Pixel Helper. If one of them doesn't produce `product_added_to_cart`, that path needs fixing in the theme, not in the pixel.

## Minutes 25 to 30: one owner per event

This is where most setups go wrong. Per Google's docs, the Google & YouTube app already sends `page_view`, `view_item`, `view_item_list`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, `search` and `purchase`. Per Shopify, the Facebook & Instagram pixel sends PageView, ViewContent, Search, AddToCart, InitiateCheckout, AddPaymentInfo and Purchase.

So "move the funnel to Customer events" might mean deleting tags, not writing them. Pick one owner per destination:

- **Apps own GA4 and Meta.** Your GTM pixel sends nothing to that GA4 property or that Meta pixel. GTM only handles vendors without an app.
- **GTM owns GA4.** Then disconnect Google Analytics in the Google & YouTube app settings, so the app stops sending to it. Google warns that this limits what the app can report, so make it a deliberate decision.

Then remove the old theme code. Shopify's migration guide gives you the trade-off: connect the new pixel before removing old code to avoid missing events, or after to avoid duplicates. On a store with real traffic, I'd rather lose an hour of `view_item` than double count a week of `add_to_cart`.

Last check: one event, one request per endpoint, in the Network tab. Then rerun the baseline from minute zero a week later.

If you'd rather have someone run this audit for you, that's the kind of work I do.

## Sources

- [Littledata: Why Shopify's Google Analytics tracking is broken (Feb 18, 2025)](https://www.littledata.io/blog/2025/02/18/why-shopifys-google-analytics-tracking-is-broken-and-how-to-fix-it)
- [shopify.dev: Web Pixels API standard events](https://shopify.dev/docs/api/web-pixels-api/standard-events)
- [shopify.dev: Web Pixels API](https://shopify.dev/docs/api/web-pixels-api)
- [shopify.dev: Pixels, strict and lax sandboxes](https://shopify.dev/docs/apps/build/marketing-analytics/pixels)
- [shopify.dev: Pixel privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy)
- [shopify.dev: DOM events](https://shopify.dev/docs/api/web-pixels-api/dom-events)
- [shopify.dev: ShopifyQL sessions schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/sessions_and_behavior/sessions)
- [Shopify Help Center: Create a Google Tag Manager custom pixel](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/gtm-tutorial)
- [Shopify Help Center: Custom pixel code](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/code)
- [Shopify Help Center: Managing custom pixels](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/manage)
- [Shopify Help Center: Pixels overview and sandbox limitations](https://help.shopify.com/en/manual/promoting-marketing/pixels/overview)
- [Shopify Help Center: Migrating pixels](https://help.shopify.com/en/manual/promoting-marketing/pixels/pixel-migration)
- [Shopify Help Center: App pixels](https://help.shopify.com/en/manual/promoting-marketing/pixels/app-pixels)
- [Shopify Changelog: New default setting for marketing pixel data sharing (Jan 13, 2026)](https://changelog.shopify.com/posts/new-default-setting-for-pixel-data-sharing)
- [Shopify Help Center: Meta data sharing levels](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing)
- [Google for Developers: Shopify event parameters (Google & YouTube app)](https://developers.google.com/tag-platform/gtagjs/reference/shopify-event-parameters)
- [Google Analytics Help: Remove duplicate tags after migrating to the Google & YouTube app on Shopify](https://support.google.com/analytics/answer/16424072)
