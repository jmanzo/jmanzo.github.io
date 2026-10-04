---
title: "Google AI Mode checkout is on by default for eligible Shopify stores. Audit it first."
description: "US Shopify stores matched to Merchant Center now sell inside Google AI Mode and Gemini by default. What changed, where the toggle lives, what to audit first."
pubDate: 2026-10-04
tags: ["shopify", "google", "agentic-commerce", "merchant-center", "checkout", "analytics"]
heroImage: "../../assets/blog/google-ai-mode-checkout-shopify/hero.png"
heroImageAlt: "Card titled Google AI Mode checkout: on by default, with four points: who's in, what changes, what breaks, the toggle"
draft: false
---

Around September 22, Google Merchant Center sent a short email to a lot of Shopify merchants. The key lines:

> "Your Shopify store was matched to your Merchant Center, enabling native checkout on Google AI Mode and Gemini."

> "Eligible products are automatically included."

Translation: if you are an eligible US Shopify store with products in Merchant Center, a shopper in Google AI Mode or the Gemini app can now hit "Buy" on your product and pay without ever loading your site. Nobody on your team had to click anything to make that happen.

The headlines framed it as "Google switched it on without asking." That's half right. The switch lives in your Shopify admin, and Shopify documents it as on by default. Google's email was the moment a lot of merchants found out.

## Who actually turned it on

Two pieces had to line up.

1. **Shopify's side.** Shopify's agentic storefronts (Sales channels > Agentic) are active by default for eligible stores, and the per-channel settings sit behind a toggle called "Allow Shopify to manage for me". Shopify's help page for this channel says it plainly: direct checkout "is active by default in your Shopify admin."
2. **Google's side.** Google matched your Shopify store to your Merchant Center account. Once that match exists, eligible products get the "Buy" button in AI Mode and Gemini, powered by the Universal Commerce Protocol (UCP) that Shopify and Google co-developed and announced on January 11, 2026.

So "without asking" is a stretch. "Enabled by default, announced by email after the fact" is accurate. For a DTC brand that obsesses over its checkout, the practical effect is the same: a second checkout you didn't build can now take your orders.

## Who's affected

Per Shopify's help center, the Google AI Mode and Gemini channel requires:

- A store based in the United States, selling to US customers. Direct checkout only shows to US-based shoppers.
- A valid Merchant Center account, with products synced through the Google & YouTube app or another feed.
- Products eligible for Shopify Catalog.
- Complete Terms of Service, Privacy Policy and Refund Policy in your store settings.
- Agreement to Shopify's Agentic Storefronts Supplemental Terms.

Not supported in direct checkout: subscriptions, bundles, customizable products and B2B-only products.

## What the buyer sees, and what you get

The shopper clicks "Buy" in Google and completes checkout inside Google's surface. Google's Merchant Center docs describe payment as Google Pay, using the cards and shipping details already saved in Google Wallet.

What lands on your side:

- **The order is yours.** Google says you stay the merchant of record. The order shows in Shopify admin with channel or referrer attribution.
- **No extra fees.** Shopify says there are no fees for this channel beyond your standard payment processing.
- **Discounts work.** Automatic discounts and discount codes are supported.
- **Your checkout customizations mostly don't.** Some checkout blocks (custom fields, upsells, specific validations) might not display.
- **Your pixels don't fire.** This is the one that bites. Shopify's doc: "Google Analytics and custom pixels won't fire in Google AI Mode and Gemini's direct checkout. The checkout fires only server-to-server pixels."

## Where to turn it off

If you decide it's not for you, here's the path in Shopify admin:

1. Go to **Sales channels > Agentic**.
2. Deactivate **Allow Shopify to manage for me**.
3. Select **Google AI Mode and Gemini**.
4. Toggle **Direct checkout** off.
5. Click **Save**.

With direct checkout off, your products can still be found in AI Mode and Gemini. The shopper just gets sent to your online store to add to cart. Step 2 hands you the settings for every AI channel, Google included. Shopify's docs also list ChatGPT, Microsoft Copilot and Meta as agentic channels, so review those while you're there instead of flipping the master switch blind.

## Don't flip it off on reflex. Audit first.

My take: an extra checkout surface on Google's own AI is not something I'd kill without looking. It's also not something I'd leave running unaudited, because it exposes every shortcut your catalog and policies have been hiding. Here is what I check.

### 1. Product data quality

The agent sells from your catalog data, not your PDP design. Titles, descriptions, variants, images, price and availability are what the shopper gets. Duplicated products with "copy" handles, vague titles and stale inventory all become customer-facing in a place where you have no theme to compensate.

Start by finding products that can't use direct checkout anyway, so you know what direct checkout won't sell:

```graphql
query UnsupportedInDirectCheckout {
  products(first: 100, query: "status:active") {
    nodes {
      title
      handle
      requiresSellingPlan
      sellingPlanGroupsCount {
        count
      }
      hasVariantsThatRequiresComponents
    }
  }
}
```

`requiresSellingPlan` and `sellingPlanGroupsCount` surface subscription products. `hasVariantsThatRequiresComponents` surfaces bundles built on Shopify's bundle model. Paginate if you have more than 100 active products.

### 2. Policies, shipping and returns

Shopify requires complete store policies and tells you to keep your return and refund policy current so Merchant Center matches your store. A shopper who never saw your site will read your return policy for the first time after something goes wrong. Pull what Shopify actually has on file:

```graphql
query StorePolicies {
  shop {
    shopPolicies {
      type
      title
      updatedAt
      url
    }
  }
}
```

Then compare against Merchant Center's return and shipping settings line by line. A mismatch here is a customer service ticket waiting to happen.

### 3. Attribution

If you rely on client-side GA4 or custom pixels in Customer Events, assume those conversions are missing for this channel. Server-to-server integrations are the only thing Shopify says fires, so check each platform's server-side setup instead of assuming. Revenue will show up in Shopify while client-side reporting undercounts. Before your next performance review, check how these orders are labeled in your store:

```graphql
query RecentOrdersByChannel {
  orders(first: 50, sortKey: CREATED_AT, reverse: true) {
    nodes {
      name
      createdAt
      sourceName
      channelInformation {
        channelDefinition {
          handle
          channelName
          subChannelName
        }
        app {
          title
        }
      }
    }
  }
}
```

Once you know the label, build a saved report or a segment for it so nobody reads a "dip" in GA4 as a real one.

### 4. Fraud and chargebacks

You're the merchant of record and you pay your normal processing fees, so treat disputes as yours. Neither Google's nor Shopify's documentation spells out chargeback handling for this channel, so confirm with your payment provider how these orders flow through your fraud tools, and watch the first few weeks of orders from this channel closely.

### 5. Checkout logic you depend on

If your checkout relies on blocks or validations (age gates, gift notes, address rules, upsells), assume they're not running here. If a product legally or operationally can't ship without that logic, that's your reason to turn direct checkout off, not a vague feeling that Google is taking something from you.

## The real question

Default-on agentic channels are the direction Shopify is going, and opting out per channel is your job now, not theirs. The brands that come out fine are the ones whose catalog, policies and tracking were clean enough to survive a checkout they don't control.

If you'd rather have someone audit this for you, that's the kind of work I do.

## Sources

- [Shopify Help Center: Selling on Google AI Mode and Gemini](https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/google)
- [Shopify Help Center: Agentic storefronts](https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts)
- [Shopify Help Center: Agentic storefronts products](https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/products)
- [Google Merchant Center Help: UCP checkout](https://support.google.com/merchants/answer/16837055?hl=en)
- [Google: New tech and tools for retailers in an agentic shopping era (Jan 11, 2026)](https://blog.google/products/ads-commerce/agentic-commerce-ai-tools-protocol-retailers-platforms/)
- [Shopify News: AI commerce at scale (Jan 11, 2026)](https://www.shopify.com/news/ai-commerce-at-scale)
- [Search Engine Roundtable: Google Merchant Center native checkout emails](https://www.seroundtable.com/google-native-checkout-emails-42140.html)
