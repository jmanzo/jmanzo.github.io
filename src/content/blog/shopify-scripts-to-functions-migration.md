---
title: "Shopify Scripts Stopped on June 30. Your Checkout Didn't Tell Anyone."
description: "Shopify Scripts were deactivated on June 30, 2026. How to find what was running, map each Script to a Function or native feature, and prove discounts apply."
pubDate: 2026-10-04
tags: ["shopify", "shopify-plus", "shopify-functions", "discounts", "checkout"]
heroImage: "../../assets/blog/shopify-scripts-to-functions-migration/hero.png"
heroImageAlt: "Card titled Scripts stopped on June 30, Checkout didn't tell anyone, with four steps: pull the report, check June orders, native first, prove it"
draft: false
---

On June 30, 2026, Shopify turned Scripts off. Not "deprecated but still running". Off. The Help Center says it plainly: any Scripts still published on your store "have been deactivated and no longer work."

Here is the part that bothers me. A deactivated Script doesn't throw an error. Checkout loads, the buyer pays, the order goes through. The volume tier, the BOGO, the wholesale price for tagged customers just isn't there. No error page, no failed order, nothing in checkout that tells anyone something is missing. The buyer pays full price, or abandons because the cart total doesn't match the promo banner your theme is still showing.

That was three months ago. If your Plus store ran Scripts and nobody rebuilt them, this is worth an afternoon.

## What actually stopped

Two dates from Shopify's changelog:

- **April 15, 2026**: Scripts could no longer be edited or published.
- **June 30, 2026**: all Scripts stopped executing.

Scripts came in three types, and each one fails in its own quiet way:

- **Line item Scripts**: tiered and volume discounts, BOGO, gift with purchase, bundle pricing, tag-based wholesale prices. Failure mode: full price.
- **Shipping Scripts**: hide, rename, reorder or discount shipping rates. Failure mode: every rate shows, with its original name and price.
- **Payment Scripts**: hide, rename or reorder payment methods. Failure mode: a gateway you hid for certain customers or countries is visible to everyone again.

None of these break checkout. That's exactly why they can go unnoticed for months.

## Step 1: Find out what was running

Shopify built a report for this. In your admin, go to **Apps > Script Editor** and click **Replace Shopify Scripts** in the banner, or open `admin.shopify.com/settings/checkout/customizations-report` directly. The Shopify Scripts customizations report lists the Scripts that were active before deprecation, grouped into payment, shipping and product discounts, with recommended Functions-based apps and links to the matching API tutorials. You can export it as CSV.

The second source of truth is your orders. Script discounts were recorded on orders as a `ScriptDiscountApplication`. Pull orders from before the cutoff and you see which Scripts actually fired, under the titles your customers saw:

```graphql
query ScriptDiscountsInOrders {
  orders(first: 50, query: "created_at:>=2026-06-01 created_at:<2026-07-01") {
    nodes {
      name
      discountApplications(first: 10) {
        nodes {
          __typename
          ... on ScriptDiscountApplication {
            title
          }
        }
      }
    }
  }
}
```

One catch: by default an app can only read the last 60 days of orders. June is outside that window now, so the app running this query needs the `read_all_orders` scope. I use both sources because they answer different questions. The report tells you what was published. The orders tell you what was actually firing at checkout.

## Step 2: Map every Script to its replacement

My rule: native first, app second, custom Function third. Every custom Function is code somebody has to own, and a Buy X Get Y someone wrote in Ruby years ago may be something the discounts admin now does natively.

| What the Script did | Replacement |
|---|---|
| Volume tiers, BOGO, gift with purchase | Native automatic discounts (Amount off products, Buy X get Y) if the rule fits. Otherwise a Discount Function, `cart.lines.discounts.generate.run` target |
| Order threshold discounts | Native Amount off order, or the order class of a Discount Function |
| Wholesale price by customer tag | B2B on Shopify: catalogs, price lists, quantity rules and volume pricing |
| Bundle pricing, merging lines | Cart Transform Function |
| Discounted shipping rates | Discount Function, `cart.delivery-options.discounts.generate.run` target |
| Hide, rename, reorder shipping rates | Delivery Customization Function |
| Hide, rename, reorder payment methods | Payment Customization Function |

One plan detail: any store can use public App Store apps that contain Functions, but only Shopify Plus stores can use custom apps with Functions. Scripts were Plus-only, so if you had Scripts you're on Plus and the custom route is open.

## Step 3: A minimal volume discount Function

The most common line item Script is "buy more, save more." Here is that rule as a Discount Function: 10% off a line at 3 or more units, 15% at 6 or more.

Generate the extension with the Shopify CLI:

```bash
shopify app generate extension --template discount --name volume-discount
```

The input query (`src/cart_lines_discounts_generate_run.graphql`) asks only for what the logic needs:

```graphql
query CartInput {
  cart {
    lines {
      id
      quantity
    }
  }
  discount {
    discountClasses
  }
}
```

The run function returns a `productDiscountsAdd` operation with one candidate per qualifying line:

```js
import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

const TIERS = [
  { minQty: 6, percent: 15 },
  { minQty: 3, percent: 10 },
];

export function cartLinesDiscountsGenerateRun(input) {
  if (!input.discount.discountClasses.includes(DiscountClass.Product)) {
    return { operations: [] };
  }

  const candidates = [];
  for (const line of input.cart.lines) {
    const tier = TIERS.find((t) => line.quantity >= t.minQty);
    if (!tier) continue;
    candidates.push({
      message: `${tier.percent}% off ${tier.minQty}+`,
      targets: [{ cartLine: { id: line.id } }],
      value: { percentage: { value: tier.percent.toFixed(1) } },
    });
  }

  if (!candidates.length) return { operations: [] };

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates,
          selectionStrategy: ProductDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}
```

The `shopify.extension.toml` wires the export to the target:

```toml
[[extensions.targeting]]
target = "cart.lines.discounts.generate.run"
input_query = "src/cart_lines_discounts_generate_run.graphql"
export = "cart-lines-discounts-generate-run"
```

Deploying the Function doesn't create a discount. You still have to create one that points at it. With `shopify app dev` running, open GraphiQL and run:

```graphql
mutation {
  discountAutomaticAppCreate(
    automaticAppDiscount: {
      title: "Volume: 10% off 3+, 15% off 6+"
      functionHandle: "volume-discount"
      discountClasses: [PRODUCT]
      startsAt: "2026-10-05T00:00:00Z"
    }
  ) {
    automaticAppDiscount { discountId }
    userErrors { field message }
  }
}
```

Hardcoded tiers are fine for a demo. In production I'd move them into a metafield on the discount so the merchant can change thresholds without a deploy.

## Step 4: Prove the discount actually applies

A Script that disappears silently deserves a replacement you verify loudly.

1. **Test each boundary.** For a tier rule that means three carts: 2 units (no discount), 3 units (10%), 6 units (15%). Check both the cart and the checkout.
2. **Watch the executions.** `shopify app dev` prints every Function run with its input and output. `shopify app function replay` lets you rerun one locally while you fix the logic.
3. **Place a real test order** and read what Shopify recorded, not what the checkout looked like:

```graphql
query CheckAllocations($id: ID!) {
  order(id: $id) {
    name
    lineItems(first: 20) {
      nodes {
        title
        quantity
        originalTotalSet { shopMoney { amount } }
        discountAllocations {
          allocatedAmountSet { shopMoney { amount } }
          discountApplication {
            __typename
            ... on AutomaticDiscountApplication { title }
          }
        }
      }
    }
  }
}
```

If `discountAllocations` is empty on a line that should be discounted, the discount didn't apply. Also check how it combines with your codes and other automatic discounts. A Function discount follows Shopify's discount combination rules like any other discount, so set its combinations on purpose instead of finding out from a support ticket that another discount won.

## Don't wait for a customer to notice

The uncomfortable math: every order since June 30 that should have carried a Script discount either paid full price or didn't happen. The report and an orders query take less than an hour. Rebuilding a tier rule as a Function, or moving it to a native discount, is a small job next to another quarter of full-price orders.

If you'd rather have someone audit this for you, that's the kind of work I do.

## Sources

- [Shopify Scripts will be deprecated on June 30, 2026 (Shopify developer changelog)](https://shopify.dev/changelog/shopify-scripts-will-be-deprecated-on-june-30-2026)
- [Shopify Scripts can no longer be edited or published (Shopify changelog)](https://changelog.shopify.com/posts/shopify-scripts-can-no-longer-be-edited-or-published)
- [Transitioning from Shopify Scripts to Shopify Functions (Shopify Help Center)](https://help.shopify.com/en/manual/checkout-settings/script-editor/migrating)
- [Discount Function API (shopify.dev)](https://shopify.dev/docs/api/functions/latest/discount)
- [Build a Discount Function (shopify.dev)](https://shopify.dev/docs/apps/build/discounts/build-discount-function?extension=javascript)
- [About Shopify Functions: availability by plan (shopify.dev)](https://shopify.dev/docs/apps/build/functions)
- [Setting up quantity rules and volume pricing in B2B (Shopify Help Center)](https://help.shopify.com/manual/b2b/catalogs/quantity-pricing)
- [Shopify API access scopes: read_all_orders (shopify.dev)](https://shopify.dev/docs/api/usage/access-scopes)
