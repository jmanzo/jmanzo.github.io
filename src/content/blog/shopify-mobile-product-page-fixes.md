---
title: "Mobile converts at 2%, desktop at 3.4%: the Shopify product page fixes worth building"
description: "Mobile is about 70% of ecommerce traffic but converts at 2% vs 3.4% on desktop. Five Shopify theme fixes for the mobile product page, with Liquid and JS."
pubDate: 2026-10-13
tags: ["shopify", "liquid", "theme-development", "performance", "accessibility", "conversion"]
heroImage: "../../assets/blog/shopify-mobile-product-page-fixes/hero.png"
heroImageAlt: "Card titled Mobile converts at 2%. Fix the product page, with four fixes: sticky buy bar, express button, delivery date, hero image first"
draft: false
---

Shopify's 2026 mobile vs desktop roundup quotes Contentsquare's 2026 Digital Experience Benchmark: mobile is about 70% of ecommerce traffic and converts at 2%, against 3.4% on desktop. That's a benchmark across 6,500 sites, not your store. Pull your own conversion rate by device first. If mobile already sits close to desktop, this isn't your problem.

Part of the gap isn't fixable anyway. The same report says desktop sessions last about twice as long, and plenty of people browse on the phone and buy on the laptop. What you can fix is friction on the page where the decision happens on a 390px screen.

The usual advice is "put the buy button, the delivery date and the express payment button above the fold." On a phone the first screen is the product photo, and it should be. So the real job is: keep a buy action reachable at every scroll position, and make the buy box worth reaching. Five fixes, all built on documented Shopify primitives.

## 1. A sticky add to cart that never covers the real buttons

Check your theme settings first. Dawn doesn't ship one. If yours doesn't either, it's one snippet, not an app subscription.

Two rules. Don't build a second form: a sticky bar with its own variant input will eventually disagree with the picker. Use the HTML `form` attribute so the sticky button submits the theme's real product form. Dawn already does this with its quantity input (`form="{{ product_form_id }}"`). And only show the bar when the real buttons are off screen, so it never sits on top of the accelerated checkout button.

```liquid
{%- comment -%} Render inside the main product section, where product_form_id exists {%- endcomment -%}
<sticky-atc class="sticky-atc" data-form-id="{{ product_form_id }}" hidden>
  <p class="sticky-atc__title">{{ product.title | escape }}</p>
  <button type="submit" form="{{ product_form_id }}" class="button">
    {{ 'products.product.add_to_cart' | t }}
  </button>
</sticky-atc>
```

```js
class StickyAtc extends HTMLElement {
  connectedCallback() {
    const form = document.getElementById(this.dataset.formId);
    const mainButton = form?.querySelector('[type="submit"]');
    if (!mainButton) return;
    const button = this.querySelector('button');

    // Mirror the real button: sold out, unavailable, disabled
    const sync = () => {
      button.disabled = mainButton.disabled;
      button.textContent = mainButton.textContent.trim();
    };
    sync();
    new MutationObserver(sync).observe(mainButton, {
      attributes: true, childList: true, subtree: true, characterData: true,
    });

    // The form holds Add to cart AND the accelerated button.
    // The 96px bottom margin hides the bar before the form scrolls into view.
    new IntersectionObserver(([entry]) => {
      this.hidden = entry.isIntersecting;
      document.documentElement.classList.toggle('has-sticky-atc', !entry.isIntersecting);
    }, { rootMargin: '0px 0px 96px 0px' }).observe(form);
  }
}
customElements.define('sticky-atc', StickyAtc);
```

```css
.sticky-atc { position: fixed; inset: auto 0 0 0; z-index: 10; display: flex; gap: 12px;
  align-items: center; padding: 12px 16px; background: #fff; }
.sticky-atc[hidden] { display: none; }
.sticky-atc .button { min-height: 48px; }
.has-sticky-atc { scroll-padding-bottom: 96px; }
@media (min-width: 750px) { .sticky-atc { display: none; } }
```

Because it submits the real form, your theme's own cart JavaScript runs: same variant, quantity, selling plan and cart drawer. If your theme listens for clicks on its button instead of the form's submit event, call `mainButton.click()` instead. That's what I did in an [A/B-tested sticky CTA build](/blog/elevating-user-experience-with-a-sticky-cta-a-case-study-on-a-7-figure-dtc-e-commerce-brand/), with a scroll listener at the time. IntersectionObserver is the cleaner check.

Accessibility is where sticky bar apps cut corners. The `hidden` attribute keeps keyboard users from tabbing through two Add to cart buttons. WCAG 2.2 criterion 2.4.11 fails a sticky footer that completely hides a focused element, and `scroll-padding-bottom` is the W3C's documented fix. WCAG 2.5.8 sets 24 by 24 CSS pixels as the minimum target. On a buy button, 48px tall is my floor.

## 2. One accelerated checkout button, in the right place

On the product page the Liquid is `{{ form | payment_button }}`, and Shopify's docs say it must be used on the `form` object inside a product form, next to the submit button. `content_for_additional_checkout_buttons` is the cart page version. Not interchangeable.

What the "show Shop Pay and Apple Pay above the fold" advice gets wrong: you don't pick the wallet. On product pages Shopify recommends a single button, chosen from your payment settings, whether Shop Promise is active, the shopper's browser and device, and their payment history. Your job is placement, directly under Add to cart. And since it belongs to the form, it can't live in the sticky bar without a second form, which is the duplicate state problem from step 1.

The button renders in a closed shadow DOM, so style it with CSS custom properties on `shopify-accelerated-checkout`. `--shopify-accelerated-checkout-button-block-size` takes 25px to 55px (44px default on product pages). Match it and the border radius to your Add to cart so the two read as one buy box.

One trade-off: per Shopify's Help Center, the button skips the cart and buys a single variant. If your AOV depends on cart upsells or a free shipping bar, the express path bypasses them. Test it.

## 3. A delivery date you can actually keep

Shopify's native **Estimated delivery dates** (Settings > Shipping and delivery) add fulfillment time to carrier transit time, with a 12 pm cutoff in the shipping origin's time zone. They display at checkout, not on the product page, and don't work with third-party app rates.

**Shop Promise** does show on the product page, as a badge container you add below the payment button. It's for qualifying US domestic orders, needs a US fulfillment location and Shop Pay activated, and eligibility is reassessed on your delivery performance.

Everyone else builds it, and there's one trap. Liquid's `'now' | date` reflects when the Liquid was last rendered, and Shopify's docs warn it may not update on every page view because of caching. A cached page promises yesterday's date. Render the inputs in Liquid, compute in the browser:

```liquid
{%- assign processing = product.metafields.custom.processing_days.value | default: 1 -%}
{%- if product.selected_or_first_available_variant.available -%}
  <p class="delivery-estimate" hidden data-processing="{{ processing }}"
    data-transit-min="3" data-transit-max="5" data-cutoff="12" data-tz="America/New_York"></p>
{%- endif -%}
```

```js
(() => {
  const el = document.querySelector('.delivery-estimate');
  if (!el) return;
  const { processing, transitMin, transitMax, cutoff, tz } = el.dataset;
  const now = new Date();
  const weekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const addBusinessDays = (start, n) => {
    const d = new Date(start);
    while (weekend(d)) d.setDate(d.getDate() + 1);
    while (n > 0) { d.setDate(d.getDate() + 1); if (!weekend(d)) n--; }
    return d;
  };
  // Cutoff checked in the warehouse time zone, not the shopper's
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(now));
  const ship = addBusinessDays(now, Number(processing) + (!weekend(now) && hour >= Number(cutoff) ? 1 : 0));
  const fmt = new Intl.DateTimeFormat(document.documentElement.lang || 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  el.textContent = `Get it ${fmt.format(addBusinessDays(ship, Number(transitMin)))} to ${fmt.format(addBusinessDays(ship, Number(transitMax)))}`;
  el.hidden = false;
})();
```

`custom.processing_days` is an integer product metafield you define. Show a range and pad it, since this skips holidays. If checkout uses Shopify's delivery dates, use the same fulfillment time and noon cutoff here so the two never disagree.

## 4. A variant picker you can use with a thumb

Most themes can switch the picker between a dropdown and buttons (Dawn's variant picker block calls them Dropdown and Pills). For options with a handful of values, use buttons. A dropdown hides availability behind a native picker and costs extra taps per option.

Shopify's high-variant guide renders options as radio inputs grouped in a `fieldset` with a `legend`, and uses `product_option_value.available` to add a `disabled` class to values with no purchasable combination. A class, not the attribute: the shopper can still pick the size and see "Sold out" instead of tapping a dead button. Give each value a real tap target, 44px on mobile.

For products with many variants, don't ship a hidden select listing every one. Shopify's guide says that pattern breaks above 250 variants. Re-render with the Section Rendering API and the `option_values` URL parameter, and handle `selected_or_first_available_variant` returning null. Size charts belong next to the size option. I covered the native pop-up version in the [app bloat audit](https://jeanmanzo.com/blog/shopify-app-bloat-audit/).

## 5. Load the first photo first

The main product image is usually the LCP element on a mobile product page. Shopify's `image_tag` lazy loads images in sections further down automatically, and the docs say not to lazy load above the fold. Shopify's performance guidance adds `fetchpriority: 'high'` to exactly one image, in the first section:

```liquid
{%- liquid
  assign media = product.selected_or_first_available_variant.featured_media | default: product.featured_media
  assign priority = 'auto'
  if section.index == 1
    assign priority = 'high'
  endif
-%}
{{ media.preview_image | image_url: width: 1200 | image_tag:
  loading: 'eager', fetchpriority: priority,
  widths: '400, 600, 800, 1200', sizes: '(min-width: 750px) 50vw, 100vw' }}
```

`section.index` is nil in the theme editor and Section Rendering API responses, so nil falls through to eager at normal priority. Two bugs to hunt: a slider that swaps `src` for `data-src` on the first slide (hiding it from the preload scanner), and `fetchpriority` on every gallery image, which Shopify warns can hurt performance.

## The order I'd ship them

Image priority and the picker first: pure friction removal. Then the sticky bar and the delivery line, which change what the shopper sees and deserve an A/B test against your own baseline. A benchmark gap is a reason to look, not a promise.

If you'd rather have someone build and test these on your theme, that's the kind of work I do.

## Sources

- [Shopify Blog: Mobile vs. Desktop Conversion Rates, 2026](https://www.shopify.com/blog/mobile-vs-desktop-conversion-rates)
- [Contentsquare: 2026 Digital Experience Benchmark](https://contentsquare.com/guides/digital-experience-benchmark/engagement/)
- [Shopify.dev: Accelerated checkout in themes](https://shopify.dev/docs/storefronts/themes/pricing-payments/accelerated-checkout)
- [Shopify.dev: payment_button](https://shopify.dev/docs/api/liquid/filters/payment_button)
- [Shopify Help Center: Accelerated checkout buttons](https://help.shopify.com/en/manual/online-store/dynamic-checkout)
- [Shopify Help Center: Setting up delivery dates](https://help.shopify.com/en/manual/fulfillment/setup/processing-time-and-delivery-dates/delivery-dates)
- [Shopify Help Center: Shop Promise on the product page](https://help.shopify.com/en/manual/shipping/shop-promise/product-page)
- [Shopify Help Center: Shop Promise eligibility](https://help.shopify.com/en/manual/shipping/shop-promise/eligibility)
- [Shopify.dev: date filter](https://shopify.dev/docs/api/liquid/filters/date)
- [Shopify.dev: Support high-variant products](https://shopify.dev/docs/storefronts/themes/product-merchandising/variants/support-high-variant-products)
- [Shopify.dev: image_tag](https://shopify.dev/docs/api/liquid/filters/image_tag)
- [Shopify.dev: fetchpriority on the LCP image](https://shopify.dev/docs/storefronts/themes/best-practices/performance/set-fetchpriority-high-on-lcp-image)
- [Shopify.dev: Never lazy load the LCP image](https://shopify.dev/docs/storefronts/themes/best-practices/performance/never-lazy-load-lcp-image)
- [W3C: Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [W3C: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
