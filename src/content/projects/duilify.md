---
title: "Duilify: A/B price testing app on the Shopify App Store"
description: "A Shopify app for testing different prices on the same products. The storefront splits visitors into price groups, a Cart Transform Function charges the right price at checkout, and order webhooks feed the results."
tier: more
order: 40
kind: "Own product"
client: "My own product"
engagement: "Designed, built and published solo"
role: "Founder and sole developer"
period: "2024–2025"
status: "Published on the Shopify App Store"
stack: ["Remix", "TypeScript", "Shopify Functions", "Theme app extension", "Prisma", "PostgreSQL", "Polaris", "Vitest"]
links:
  - { label: "App Store listing", href: "https://apps.shopify.com/duilify" }
cover: "../../assets/projects/duilify-promo.jpg"
coverAlt: "Duilify App Store artwork showing the test setup screen with control and test groups"
---

## What it does

Merchants guess at prices. Duilify lets them test instead: create a test, put products into groups, and give each group a percentage or fixed price change. Visitors are split between the groups by the distribution the merchant sets, and the app tracks views and sales for each price side by side.

![Duilify price test flow: storefront assigns a price group, a Cart Transform Function applies it, order webhooks feed the results](../../assets/projects/duilify-flow.svg)

## How it works

- **Storefront.** A theme app extension assigns each visitor to a group and shows that group's price, with cached price lookups so it doesn't hammer the API.
- **Checkout.** A Cart Transform Function reads the visitor's group from the cart line and the price rules from a variant metafield, and sets the line price inside Shopify's checkout. The price a visitor saw is the price they pay.
- **Results.** Order webhooks, processed idempotently, record sales per group for the analytics view.

The app passed Shopify's App Store review and is listed publicly.

![Duilify storefront preview with a production test running on a demo store](../../assets/projects/duilify-ui.jpg)
