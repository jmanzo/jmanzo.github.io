---
title: "Your Shopify purchase tracking may not have survived the August 26 upgrade"
description: "Non-Plus Shopify stores were auto-upgraded after August 26, 2026 and Additional Scripts stopped running. How to tell if tracking broke and rebuild it right."
pubDate: 2026-10-04
tags: ["shopify", "analytics", "web-pixels", "checkout-extensibility", "ga4", "tracking"]
heroImage: "../../assets/blog/shopify-thank-you-page-tracking-additional-scripts/hero.png"
heroImageAlt: "Card titled Tracking broke after Aug 26? Check the ratio, with four steps: one table, read the step, app pixels, custom pixel"
draft: false
---

August 26, 2026 was the deadline for non-Plus Shopify stores to upgrade their Thank you and Order status pages on their own terms. Stores that hadn't upgraded by then were upgraded automatically.

The new pages don't run Additional Scripts. So if your Meta pixel, Google Ads conversion tag, affiliate snippet or GA4 purchase event lived in that box under Settings > Checkout, it stopped firing the day your store switched over. No error. No email that says "your ROAS is now fiction". The store keeps taking orders, so nobody looks.

Here is how to check whether it happened to you, and how to rebuild it so it doesn't happen again.

## What actually changed, by plan

The dates differ by plan, and the anchor most people quote only covers half of it.

**Shopify Plus.** August 28, 2025 was the deadline. On that date `checkout.liquid`, Additional Scripts and Order status script tags were sunset on the Thank you and Order status pages for Plus stores. Plus stores that still hadn't upgraded were auto-upgraded starting January 2026, each with a 30-day notice. Shopify's Plus guide is blunt about what that meant: "All analytics scripts will be lost." It adds that "a limited number of analytics scripts might be moved to custom pixels in a best-effort attempt". Best effort. Not a migration.

**Every other plan.** August 26, 2026 was the deadline. Stores not upgraded by then were upgraded automatically, and Order status script tags stopped running for all remaining stores on that date.

**Everyone.** Since August 28, 2025, the Additional Scripts section in Checkout settings has been view-only. You couldn't edit those scripts for the last year anyway, which is why a lot of stores simply stopped touching them.

One more detail: Shopify did generate a personalized upgrade guide in the admin that categorized each store's Additional Scripts and flagged apps that needed an update. If someone on your team clicked through it and replaced everything, you're fine. If it sat unread until the auto-upgrade, assume nothing was replaced.

## How to tell if your tracking broke

Don't trust a dashboard that says "looks fine". Build one small table. One row per day, from two weeks before your store's upgrade date to two weeks after.

| Day | Shopify online orders | GA4 purchases | Meta Purchase events |
|---|---|---|---|
| ... | ... | ... | ... |

Where each number comes from:

- **Shopify:** orders per day, filtered to the Online Store channel. Leave out POS, draft orders and subscription renewals. Those never pass through the Thank you page, so they would inflate the baseline.
- **GA4:** purchases or transactions per day (an Exploration with Date as the dimension works).
- **Meta:** the Purchase event volume per day in Events Manager for your pixel or dataset.

Then compute GA4 / Shopify and Meta / Shopify for each day. You are not looking for 100%. Ad blockers, consent banners and closed tabs mean the ratio is never perfect. You are looking for a step change on the cutover day:

- **Ratio drops to near zero:** the script that sent the event is gone and nothing replaced it.
- **Ratio drops partially and stays down:** possibly one platform was replaced and another wasn't, or the replacement now respects consent. Shopify itself warns that pixels only track with consent, so some drop is expected after switching. A cliff is not.
- **Ratio jumps to roughly 2x before the cutover:** someone installed an app pixel without removing the old script. Duplicate purchases inflate ROAS and train ad algorithms on garbage.

Use the actual upgrade date for your store, not August 26 by default. If you upgraded manually in March and skipped the scripts step, your tracking broke in March.

## Check Customer events before you rebuild

Before writing anything new, open Settings > Customer events and look at what's already there. On Plus, Shopify's guide says some analytics scripts may have been moved to custom pixels automatically. Read every pixel that exists, confirm what it sends, and decide whether to keep it, fix it or replace it with an app pixel. A pixel nobody can explain is the next tracking bug.

## Rebuild it the right way

The replacement for "paste a script on the Thank you page" is Customer events (Settings > Customer events), which is the merchant-facing side of Shopify's Web Pixels API. Pixels run in a sandbox, receive standardized events like `checkout_completed`, and respect customer privacy settings. Pick the replacement in this order.

### 1. App pixels for the big platforms

GA4 and Google Ads: install the Google & YouTube app and connect your Google tag. Meta: install Facebook & Instagram and pick a data sharing level. At Maximum, the store uses Meta's Conversions API alongside the pixel, which is a better setup than the browser-only script most stores had in Additional Scripts.

Shopify's own docs call app pixels the recommended solution. Don't hand-roll a GA4 purchase pixel and also run the Google app. That is the duplicate scenario from the table above.

### 2. Custom pixels for platforms without an app

Affiliate networks, smaller ad platforms, your own endpoint: those go in a custom pixel. In Customer events, click Add custom pixel, name it, set the Customer privacy permission, paste the code, save, then connect.

Custom pixels get `analytics`, `browser` and `init` already in scope. A minimal purchase pixel looks like this:

```js
// Settings > Customer events > Add custom pixel
analytics.subscribe('checkout_completed', (event) => {
  const checkout = event.data.checkout;

  const payload = {
    event_id: event.id, // stable id for deduplication
    order_id: checkout.order?.id,
    value: checkout.totalPrice?.amount,
    currency: checkout.currencyCode,
    items: checkout.lineItems.map((item) => ({
      sku: item.variant?.sku,
      quantity: item.quantity,
      price: item.variant?.price?.amount,
    })),
  };

  // Replace with your platform's endpoint or SDK call
  fetch('https://example.com/conversions', {
    method: 'POST',
    body: JSON.stringify(payload),
    keepalive: true,
  });
});
```

Two behaviors worth knowing before you trust the numbers. `checkout_completed` fires once per checkout, normally on the Thank you page. If you run a post-purchase upsell, it fires on the first upsell page instead and does not fire again on the Thank you page. And if that page fails to load, the event never fires at all.

Test it with the Shopify Pixel Helper extension and a real test order, ideally on a dev store first. Watch the Network tab to confirm the request leaves the browser.

### 3. Anything that rendered UI goes to extensions

Additional Scripts were also used to draw things: post-purchase surveys, referral widgets, "how did you hear about us" forms, download links. Pixels can't render UI. Those move to checkout UI extensions on the Thank you page (`purchase.thank-you.block.render`) and customer account UI extensions on the Order status page (`customer-account.order-status.block.render`), placed with the checkout and accounts editor. Most survey and referral apps already ship these blocks, so check the app before building one.

### 4. One source per platform

After the rebuild, list every place a purchase can be sent from: app pixels, custom pixels, and any GTM container loaded by a custom pixel. Each platform should get its purchase from exactly one of them. Shopify's guide warns about this exact failure during migration: when the script and the app pixel both fire, the platform counts both.

## The real lesson

Additional Scripts let anyone paste anything into the most valuable page of the funnel, with no events contract, no consent handling and no ownership. That model is gone, and good riddance. The new one is better, but only if someone actually does the migration and verifies it against order counts.

If you'd rather have someone audit this for you, that's the kind of work I do.

## Sources

- [Shopify Help Center: Upgrading your Thank you and Order status pages](https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/upgrade-thank-you-order-status)
- [Shopify Help Center: Plus upgrade guide](https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/upgrade-thank-you-order-status/plus-upgrade-guide)
- [Shopify Help Center: Non-Plus upgrade guide](https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/upgrade-thank-you-order-status/upgrade-guide)
- [Shopify Help Center: Reviewing and replacing additional scripts](https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/upgrade-thank-you-order-status/additional-scripts)
- [shopify.dev: Order status script tags deprecation](https://shopify.dev/docs/apps/build/online-store/script-tag-deprecation/order-status)
- [shopify.dev: checkout.liquid](https://shopify.dev/docs/storefronts/themes/architecture/layouts/checkout-liquid)
- [shopify.dev: Web Pixels API, checkout_completed](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed)
- [Shopify Help Center: Testing custom pixels](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/testing)
- [Shopify Help Center: Meta data sharing levels](https://help.shopify.com/en/manual/promoting-marketing/analyze-marketing/meta-data-sharing)
