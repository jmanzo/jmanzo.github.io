---
title: "cart.total_discount returns 0 in the middle of your sale"
description: "Shopify runs two separate discount systems, and cart.total_discount only totals one of them. Why compare-at sales report zero savings, and the safe fix."
pubDate: 2026-07-14
tags: ["shopify", "liquid", "cro", "ecommerce"]
draft: false
---

Sale season request from a European fashion brand: show the customer's total savings in the cart drawer. "Total discount: -EUR 53,97". One line of Liquid, right?

First look at the data: subtotal EUR 125,93. Total EUR 125,93. `cart.total_discount`: 0.

The customer had two marked-down items in the cart, EUR 53,97 in strikethrough savings staring at them. As far as Shopify's cart object was concerned, they were saving nothing.

If you build Shopify themes, you will hit this. Every merchant eventually asks for some version of it: a savings line in the cart drawer, a "you saved X" summary on the cart page, a progress bar toward a discount threshold. And every one of those implementations runs into the same wall, because Shopify runs two completely separate discount systems and only totals one of them.

## Two discount systems, one that doesn't total

System 1: native discounts. Discount codes, automatic discounts, line-level allocations, cart-level promotions. These are real discount objects in the platform. They flow into `cart.total_discount`, into `line_item.line_level_total_discount`, and into the difference between `cart.original_total_price` and `cart.total_price`.

System 2: compare-at pricing. The "was" price. `variant.compare_at_price` is a display value for marketing. It never enters cart math. Not in `original_total_price`, not in `total_discount`, not in any line item total. Mark your entire catalog 30% down for summer by editing `compare_at_price` and the cart object reports a store with no sale running.

Here's what makes it a trap: most sale merchandising is done through compare-at markdowns, not discount codes. So the merchant runs their biggest campaign of the year, the collection pages show strikethrough prices everywhere, and the obvious implementation (`{{ cart.total_discount | money }}`) renders 0 in the drawer. Exactly when the savings message matters most.

## Why summing the two is safe

The instinct that stops most devs from fixing it is the fear of double counting: what if Shopify already folds compare-at savings into `total_discount` somewhere, and my sum shows inflated numbers? It doesn't. Ever. The docs are explicit: every cart total is built from `variant.price`. `cart.original_total_price` is the sum of `variant.price` times quantity before native discounts, `cart.total_price` is the same sum after them, and `cart.total_discount` is the difference. `compare_at_price` lives entirely outside that pipeline.

Which means the two sources are mathematically independent, and addition is safe:

## The fix

```liquid
{%- liquid
  assign savings = cart.total_discount
  for item in cart.items
    assign cap = item.variant.compare_at_price
    if cap > item.variant.price
      assign diff = cap | minus: item.variant.price | times: item.quantity
      assign savings = savings | plus: diff
    endif
  endfor
-%}
{% if savings > 0 %}
  Total discount: -{{ savings | money }}
{% endif %}
```

Drop it in the drawer footer above the total. The `> 0` guard makes the line disappear for full-price carts. And if your cart drawer re-renders through the Section Rendering API, the line updates on every quantity change and item removal with zero JavaScript. The Liquid runs again on each render, so the math stays correct without maintaining a client-side mirror of it.

## Where else this applies

The same model applies anywhere you surface savings: cart page totals, upsell blocks, post-add popups. Compute both halves, add them, done.

Why it matters: the cart drawer is the last screen before checkout. During a markdown sale, "you are saving EUR 53,97" is the strongest line of copy on that screen, and it's the one most themes fail to render because the platform won't total it for them.

Before adding any savings UI to a cart, ask one question: which of the two systems does this merchant actually use for sales? If the answer is compare-at, and it usually is, `cart.total_discount` alone will betray you.

This is the same kind of platform literacy behind [how I build CRO into Shopify theme code](/blog/how-web-components-enhance-cro-development-for-shopify-stores/) rather than bolting it on after.

(One caveat: if a pricing app rewrites `variant.price` directly instead of using discounts or `compare_at_price`, the independence assumption breaks. Audit the app before trusting the math.)
