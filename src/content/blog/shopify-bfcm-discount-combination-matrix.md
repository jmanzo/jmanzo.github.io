---
title: "Six Weeks to Black Friday: Test How Your Shopify Discounts Stack"
description: "Build a discount combination matrix from your real Shopify discounts, fix the free shipping bar math, and test every pair before BFCM goes live."
pubDate: 2026-10-14
tags: ["shopify", "discounts", "bfcm", "checkout", "graphql", "themes"]
heroImage: "../../assets/blog/shopify-bfcm-discount-combination-matrix/hero.png"
heroImageAlt: "Card titled BFCM discounts stack wrong? Build the matrix first, with four steps: pull the data, check both sides, fix the bar, test the edges"
draft: false
---

Black Friday is November 27. Six weeks from now, someone on your team will create a sitewide code, an automatic gift with purchase, a free shipping offer and probably an app campaign or two. Each one gets set up on its own screen, with its own combination checkboxes, by whoever had time that afternoon.

Shopify will then do exactly what those settings say. That's the problem. Nobody reads the settings as a set until a customer emails a screenshot of a cart drawer that promised free shipping and a checkout that charged for it.

This is the matrix I'd build and the test protocol I'd run before any promo goes live.

## The rules, as Shopify documents them

Every discount belongs to one or more of three classes: **product**, **order** or **shipping**. Shopify's Help Center lays out the sequence:

- Product discounts apply first, to individual items.
- Order discounts apply to the revised subtotal after product discounts.
- Shipping discounts apply last.

Then the rules that matter for a promo calendar:

- **Both discounts have to allow it.** "Multiple discounts are applied to an order only when the setting on each discount allows the combination." Discounts don't combine by default. One side checked is the same as neither.
- **When they can't combine, Shopify picks.** The best discount for the customer's cart applies. And when a shipping discount can't combine with a product or order discount, the product or order discount takes priority.
- **One shipping discount per order.** Two free shipping offers never stack.
- **Hard limits:** a maximum of 5 product or order discount codes and 1 shipping code per order, and a maximum of 25 active automatic discounts per store.
- **Same item, two product discounts:** Shopify Plus only.
- **Buy X get Y outside Plus:** products in a Buy X get Y discount can't get further product discounts, and a code that applies to them removes the Buy X get Y discount.
- **Channels:** combinations only work on Online Store, Storefront API and Shopify POS orders. Manual custom discounts, like the one you add on a draft order, always apply regardless of combination settings.

Discount Functions play by the same rules. A Function-backed discount carries the same `combinesWith` settings as a native one, set when you create it with `discountAutomaticAppCreate` or `discountCodeAppCreate`. If you rebuilt your old Scripts as Functions this year ([here's how I'd do that](https://jeanmanzo.com/blog/shopify-scripts-to-functions-migration/)), those discounts belong in the matrix too.

## Where it actually breaks

### The free shipping bar does math the checkout doesn't

Most free shipping bars live in the theme. They read the Liquid `cart` object (or `/cart.js`) and compare a number against a threshold. Which number matters:

- `cart.original_total_price`: before discounts.
- `cart.items_subtotal_price`: after line item discounts, before cart-level discounts.
- `cart.total_price`: after the discounts the cart knows about.

The checkout uses the discounted cart. Shopify's combinations page says it directly: "the discounted cart value is used to calculate shipping options."

So take a $100 free shipping threshold and a $110 cart. The bar says free shipping. The customer types a 20% code at checkout, the subtotal drops to $88, and the free rate disappears. The bar wasn't lying when it rendered. It rendered before the code existed. Unless your theme applies codes in the cart (the Cart AJAX API accepts a `discount` parameter on `/cart/update.js` for exactly that), the cart drawer is doing math on a cart the customer is about to change.

Same story with `original_total_price`. If your sale runs as automatic product discounts, a bar reading the pre-discount total is wrong on every cart, code or no code.

### The free shipping offer that loses to the BFCM code

An automatic free shipping discount over $75, and a BFCM20 order code. If the free shipping discount isn't set to combine with order discounts, the order discount wins, because product and order discounts take priority over shipping when they can't combine. The bar still shows free shipping. The checkout shows a shipping charge. Both are "correct".

### BXGY plus a sitewide code

On non-Plus stores, a sitewide product code that touches items in your Buy X get Y removes the Buy X get Y. The free gift vanishes at checkout and the customer sees it as a bug.

### The 25-slot ceiling

Twenty-five active automatic discounts sounds like plenty until you count last year's leftovers, a loyalty app and a bundle app that each create their own. Check the count before you schedule the BFCM set, not on the morning of.

### Currency

Fixed-amount discounts are set in your store currency and converted at checkout, so the amount can move with exchange rates. Percentage discounts have no currency. A bar threshold stored as a plain number in theme settings has no idea which currency the cart is in.

## Build the matrix from data, not memory

Don't build this from the Discounts page and your recollection of what the checkboxes said. Pull it. `discountNodes` returns code and automatic discounts in one list (`automaticDiscountNodes` and `codeDiscountNodes` are deprecated). `discount` is a union, so each type needs its own fragment:

```graphql
query DiscountMatrix($cursor: String) {
  discountNodes(first: 50, after: $cursor, query: "status:active,scheduled") {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      discount {
        __typename
        ... on DiscountCodeBasic {
          title status discountClasses startsAt endsAt
          combinesWith { ...Combos }
          minimumRequirement { ...Minimum }
        }
        ... on DiscountCodeBxgy {
          title status discountClasses startsAt endsAt
          combinesWith { ...Combos }
        }
        ... on DiscountCodeFreeShipping {
          title status discountClasses startsAt endsAt
          combinesWith { ...Combos }
          minimumRequirement { ...Minimum }
        }
        ... on DiscountCodeApp {
          title status discountClasses startsAt endsAt
          combinesWith { ...Combos }
          appDiscountType { title app { title } }
        }
        ... on DiscountAutomaticBasic {
          title status discountClasses startsAt endsAt
          combinesWith { ...Combos }
          minimumRequirement { ...Minimum }
        }
        ... on DiscountAutomaticBxgy {
          title status discountClasses startsAt endsAt
          combinesWith { ...Combos }
        }
        ... on DiscountAutomaticFreeShipping {
          title status discountClasses startsAt endsAt
          combinesWith { ...Combos }
          minimumRequirement { ...Minimum }
        }
        ... on DiscountAutomaticApp {
          title status discountClasses startsAt endsAt
          combinesWith { ...Combos }
          appDiscountType { title app { title } }
        }
      }
    }
  }
}

fragment Combos on DiscountCombinesWith {
  productDiscounts
  orderDiscounts
  shippingDiscounts
}

fragment Minimum on DiscountMinimumRequirement {
  __typename
  ... on DiscountMinimumSubtotal {
    greaterThanOrEqualToSubtotal { amount currencyCode }
  }
  ... on DiscountMinimumQuantity {
    greaterThanOrEqualToQuantity
  }
}
```

It needs the `read_discounts` scope. Include `scheduled` on purpose: the BFCM discounts you created early are exactly the ones you need to check. One more thing as of API version 2026-10: discounts can now be part of a Rollout, and Shopify notes that for those, `startsAt` and `endsAt` alone don't describe availability.

Then turn the nodes into pairs. A pair can combine only if each discount allows every class of the other:

```js
// discounts = data.discountNodes.nodes.map((n) => n.discount)
const KEY = {
  PRODUCT: 'productDiscounts',
  ORDER: 'orderDiscounts',
  SHIPPING: 'shippingDiscounts',
};

const allows = (a, b) => b.discountClasses.every((c) => a.combinesWith[KEY[c]]);
const isShipping = (d) => d.discountClasses.includes('SHIPPING');

export function pairMatrix(discounts) {
  const rows = [];
  for (let i = 0; i < discounts.length; i++) {
    for (let j = i + 1; j < discounts.length; j++) {
      const a = discounts[i];
      const b = discounts[j];
      let result = allows(a, b) && allows(b, a) ? 'combine' : 'best one wins';
      if (isShipping(a) && isShipping(b)) result = 'one shipping discount max';
      rows.push({ a: a.title, b: b.title, result });
    }
  }
  return rows;
}
```

Paste the output into a sheet. Now go down the "best one wins" rows and ask, for each one: is that what marketing promised? Every row where the answer is no is a checkbox to fix this week. Every row where it's yes is a sentence your banner shouldn't contradict.

"Combine" in the sheet means "allowed to combine". Eligibility still applies: minimums, product selections, customer eligibility, and the Plus-only rules above. That's what the test is for.

## Fix the bar so it can't over-promise

Two rules for the theme. Compare against `cart.total_price`, never `original_total_price`. And only show a fixed threshold when the cart is in the currency the threshold was written in:

```liquid
{%- liquid
  # free_shipping_threshold: a number setting you add to the theme, in store currency
  assign threshold = settings.free_shipping_threshold | times: 100
  assign remaining = threshold | minus: cart.total_price
-%}
{%- if cart.item_count > 0 and cart.currency.iso_code == shop.currency -%}
  {%- if remaining > 0 -%}
    <p>{{ remaining | money }} away from free shipping.</p>
  {%- else -%}
    <p>Free shipping over {{ threshold | money }}, after discounts.</p>
  {%- endif -%}
{%- endif -%}
```

And keep that setting equal to the real threshold: the order price condition on your free shipping rate, or the minimum on your free shipping discount. Two sources of truth for one number is how this bug gets born.

## The test protocol

**1. Write the cases from the matrix.** Every "combine" pair a real customer could hit, every "best one wins" pair marketing cares about, and three carts per threshold: just under, just over, and over before the code but under after it. That third cart is the one that catches the bar.

**2. Test on the live checkout without exposing anything.** Automatic discounts now support customer eligibility (all customers, segments or specific customers), and so do codes. Create the BFCM set active now, eligible only for a staff test customer, and log in as that customer. Remember those test copies count toward the 25.

**3. Put theme changes in a duplicate theme.** Fix the bar in an unpublished copy and walk the cases through its preview. The checkout uses the store's real discounts and rates either way.

**4. Most rows don't need a payment.** Checkout shows the discount lines, the subtotal and the shipping rate before anyone pays. For the handful of full orders you want end to end, use a development store with Shopify's Test payment gateway, or a real order you cancel and refund. Don't switch your live store to test mode in October: Shopify warns that customers can't place live orders while a payment provider is in test mode.

**5. Record expected vs actual.** Per row: what the bar said, the checkout subtotal, the discount lines, the shipping line. For the full orders, read the `discountApplications` on the order in the Admin API, not the screenshot.

**6. Freeze.** Pick a date after which nobody creates or edits a discount without rerunning the matrix. On launch day, switch eligibility to all customers and rerun the three threshold carts. Five minutes. Cheaper than learning it from support tickets on Friday morning.

## The checkout is right. Your bar might not be.

Shopify's discount engine is deterministic. It applies what the settings allow and keeps the best option when they don't. Every BFCM discount complaint I'd expect this year comes from a gap between that logic and something a human wrote: a banner, a bar, an email. The matrix closes the gap before customers find it.

If you'd rather have someone build and run this matrix for you, that's the kind of work I do.

## Sources

- [Combining discounts (Shopify Help Center)](https://help.shopify.com/manual/discounts/discount-combinations)
- [Discounts overview (Shopify Help Center)](https://help.shopify.com/en/manual/discounts)
- [Discounts with multiple currencies (Shopify Help Center)](https://help.shopify.com/manual/markets/pricing/discounts)
- [Customer eligibility for automatic discounts (Shopify changelog)](https://changelog.shopify.com/posts/customer-eligibility-for-automatic-discounts)
- [Shopify Payments test mode and Test payment gateway (Shopify Help Center)](https://help.shopify.com/en/manual/checkout-settings/test-orders/payments-test-mode)
- [Placing test orders (Shopify Help Center)](https://help.shopify.com/en/manual/checkout-settings/test-orders)
- [discountNodes query (shopify.dev)](https://shopify.dev/docs/api/admin-graphql/latest/queries/discountNodes)
- [DiscountCombinesWith object (shopify.dev)](https://shopify.dev/docs/api/admin-graphql/latest/objects/DiscountCombinesWith)
- [Discounts can now be included in rollouts (shopify.dev changelog)](https://shopify.dev/changelog/discounts-can-now-be-included-in-rollouts)
- [Building discounts with Shopify Functions (shopify.dev)](https://shopify.dev/docs/apps/build/discounts)
- [Liquid cart object (shopify.dev)](https://shopify.dev/docs/api/liquid/objects/cart)
- [Cart AJAX API (shopify.dev)](https://shopify.dev/docs/api/ajax/reference/cart)
