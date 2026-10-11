---
title: "Diagnosing a Slow Shopify Store Like a Developer"
description: "Shopify passes Core Web Vitals more often than most of the web. If your store doesn't, here's the ordered workflow to find what you added that made it slow."
pubDate: 2026-10-15
tags: ["shopify", "performance", "core-web-vitals", "liquid", "theme-development"]
heroImage: "../../assets/blog/diagnose-slow-shopify-store/hero.png"
heroImageAlt: "Card titled Shopify isn't slow. Your store is., with four diagnosis steps: field data first, price each script, fix the LCP image, reserve app space"
draft: false
---

Start with the number most merchants get backwards.

Per the HTTP Archive Web Almanac 2025, 48% of mobile websites pass all three Core Web Vitals. In the same report's ecommerce chapter, Shopify origins pass on mobile at 76%, the highest of any platform in its table. WooCommerce sits at 35%, Magento at 35%.

So the platform is not your problem. If your store fails, it's usually something added on top: an app script, a page builder section, a hero image the browser finds too late, a widget that pops in after the page settled.

A July 2026 Fudge report (Fudge sells a page editor, and says so) calls app JavaScript "the single largest factor" in the stores they've audited, and puts drag-and-drop builders at 22 to 37% slower than native theme code across 500+ stores. The methodology isn't published, so treat those as one vendor's numbers. The public data points the same way: the 2024 Web Almanac found presentation delay is the main contributor to poor INP, "mostly caused by third-party scripts."

None of that tells you which script, on which page, is costing you. Here's the order I work in.

## 1. Start with field data, in your own admin

Real customers first, lab scores later. Shopify has built-in web performance reports. A summary sits on Online Store > Themes, and the full set lives in Analytics > Reports (search "contentful" for LCP, "next" for INP, "cumulative" for CLS, or ":" to list all of them). You need the Reports staff permission, and the store can't be password protected or there's no data.

What it gives you, per Shopify's Help Center:

- LCP, INP and CLS from real user data, at the 75th percentile, ranked Good, Moderate or Poor
- Thresholds: LCP 2,500 ms, INP 200 ms, CLS 0.1 for Good
- Breakdowns by page type and by page URL, filterable by device
- Over Time charts with numbered annotations for app installations, theme updates and new code

That last one is the most underused part of these reports. If INP on product pages jumped the week an annotation shows an app install, you have a suspect before opening DevTools.

Write down three things: which metric fails, on which page type, on which device. Caveats from Shopify's docs: data can lag up to 36 hours, only 90 days are kept, and low-traffic stores fluctuate.

## 2. Cross-check in PageSpeed Insights, and know which half to trust

Run your worst page through PageSpeed Insights. The top section is field data from the Chrome UX Report: real Chrome users, previous 28 days, 75th percentile, falling back to the whole origin if the page lacks traffic. The bottom section is one Lighthouse run on a simulated mid-tier phone.

Field tells you whether there's a problem. Lab helps you debug it. Never the other way around.

The trap: Lighthouse only observes the page loading. It doesn't click anything, so it can't measure INP. Google's INP guide calls Total Blocking Time "a reasonable proxy," but it's a proxy. A store can score well in Lighthouse and still fail INP for shoppers who tap the variant picker and add to cart.

## 3. Find which scripts cost the most

Open Chrome DevTools on the failing page type, in an incognito window so extensions stay out of the trace.

**Performance panel, throttled.** It shows live LCP and CLS on open, INP once you interact, and can compare your local numbers against CrUX field data. Turn on CPU throttling (calibrated presets if your machine is fast) and record a page load.

**The 1st / 3rd party table.** Select the full range in the timeline overview with nothing else selected, and the Summary tab lists transfer size and main thread time per entity. That's the closest thing to an itemized bill for your apps. Hover an entity and jump to Bottom-up to see which functions burned the time. "Dim 3rd parties" grays out everything that isn't yours.

**The Insights tab.** Lighthouse's checks mapped onto your trace: LCP request discovery, third parties, duplicated and legacy JavaScript.

**Coverage.** More options > More tools > Coverage, hit reload, and you get used vs unused bytes per JS and CSS file. An app that ships a big bundle to render one star rating shows up here fast.

Every host you find should map to an app you still pay for. If it doesn't, that's leftover code, and I covered how to hunt it down (and what it costs monthly) in the [app bloat audit](https://jeanmanzo.com/blog/shopify-app-bloat-audit/). Here we care about what the scripts you keep cost on the main thread.

## 4. INP: where app JavaScript hurts the most

INP replaced First Input Delay as a Core Web Vital on March 12, 2024. FID only measured the delay before the first interaction's handler started. INP watches every click, tap and key press in the visit and reports the slowest (ignoring outliers), split into input delay, processing duration and presentation delay.

Why apps hit this so hard: when a shopper taps Add to cart, every script listening to that click runs. Theme cart code, an upsell app, an analytics tag. Each adds processing time. If the main thread is still busy with some app's startup work, that's input delay on top.

The fastest attribution is the Long Animation Frames API (Chrome 123+). Paste this in the console, use the page like a customer for a minute (pick a variant, add to cart, open the cart drawer), then run `report()`:

```js
const bySource = new Map();

new PerformanceObserver((list) => {
  for (const frame of list.getEntries()) {
    for (const s of frame.scripts) {
      // Full URL, not hostname: theme and app extension files both live on cdn.shopify.com
      const src = s.sourceURL ? s.sourceURL.split('?')[0] : '(inline or unknown)';
      const row = bySource.get(src) || { src, scripts: 0, ms: 0 };
      row.scripts += 1;
      row.ms += s.duration;
      bySource.set(src, row);
    }
  }
}).observe({ type: 'long-animation-frame', buffered: true });

function report() {
  console.table([...bySource.values()].sort((a, b) => b.ms - a.ms));
}
```

Each entry is a frame that took longer than 50 ms, and `scripts` says which code ran inside it. Files under `/extensions/` on cdn.shopify.com are app theme extensions. The top of that table is your INP shortlist. For a single click, the live view's Interactions tab shows the three phases.

What to do with the shortlist:

- **If it's an app:** does it load on every page when its feature lives on one? App blocks only load where they're placed, and app embeds can be limited to specific templates with `enabled_on`. If the vendor hasn't done that, ask why. Built for Shopify apps "must not reduce the storefront Lighthouse performance score by more than ten points," weighted across home, product and collection pages. Lighthouse doesn't measure INP, so that badge doesn't clear an app for INP.
- **If it's your own theme code:** break long handlers up. Update the UI the shopper is waiting for first, then yield before the rest:

```js
function yieldToMain() {
  if (globalThis.scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

button.addEventListener('click', async () => {
  showLoadingState();      // the visible feedback, right away
  await yieldToMain();
  await addToCart();       // network and cart re-render
  await yieldToMain();
  trackAddToCart();        // analytics can wait a frame
});
```

That's the pattern from Google's long tasks guide. The three function names are placeholders for your theme's own.

## 5. LCP: stop lazy-loading the hero

On most Shopify pages the LCP element is an image: the hero banner, or the first product image. Per the 2025 Web Almanac, about 16 to 17% of pages still lazy-load their LCP image, and only 17% of mobile pages with an LCP image use `fetchpriority`.

Per shopify.dev, if you don't pass `preload`, `image_tag` automatically sets `loading="lazy"` for images in sections further down the page. Don't leave the hero to that guess. Decide explicitly with `section.index`, which Shopify documents for this use case. Dawn's image banner sets `fetchpriority: 'high'` when `section.index == 1`. A stricter version:

```liquid
{%- liquid
  assign above_fold = false
  if section.location == 'template' and section.index == 1
    assign above_fold = true
  endif
-%}

{%- if above_fold -%}
  {{ section.settings.image
    | image_url: width: 2400
    | image_tag:
      sizes: '100vw',
      widths: '750, 1100, 1500, 2000, 2400',
      fetchpriority: 'high',
      loading: 'eager',
      preload: true
  }}
{%- else -%}
  {{ section.settings.image
    | image_url: width: 2400
    | image_tag: sizes: '100vw', widths: '750, 1100, 1500, 2000, 2400', loading: 'lazy'
  }}
{%- endif -%}
```

Three details worth knowing:

- `preload: true` doesn't touch the `<img>` tag. Shopify sends a `Link: rel=preload` HTTP header. Use it sparingly, above the fold only. Preload five images and none of them is a priority.
- `fetchpriority` isn't a named `image_tag` parameter. It works because the filter turns extra parameters into HTML attributes, which is how Dawn uses it.
- `section.index` is `nil` in the theme editor, with the Section Rendering API and in static sections, so the `else` branch has to be a safe default.

If your hero is a CSS background, a JavaScript slider or a page builder section that renders client side, the browser can't find the image until that code runs. The DevTools "LCP request discovery" insight flags this. No attribute fixes it. The image has to be in the HTML.

## 6. CLS: app widgets that arrive late

Google's CLS guide lists "dynamically injected content" among the most common causes of layout shift. On Shopify stores that's often an app: star ratings under the title, payment messaging under the price, an upsell block. The shopper starts reading, then the widget arrives and pushes everything down.

Find it in the Performance panel's Layout shifts track. Clicking a shift highlights the moved elements, which can be the ones that got pushed rather than the cause. Look at what appeared above them.

The fix is reserving the space before the widget loads. If the app renders as an app block, wrap it in your section:

```liquid
{%- case block.type -%}
  {%- when '@app' -%}
    <div class="product__app-slot">
      {%- render block -%}
    </div>
{%- endcase -%}
```

```css
/* Measure the widget's real rendered height at each breakpoint. Don't guess. */
.product__app-slot { min-height: 22px; }
```

That 22px is a placeholder. Use the widget's real height, and don't put one blanket min-height on every app block or empty ones will leave gaps. If the app injects itself with JavaScript into a spot you don't control, that's a conversation with the vendor, or a reason to pick one that ships an app block.

## 7. Re-measure on the right clock

Ship one fix at a time, on a duplicate theme first. Lab results move right away. Field data doesn't: PageSpeed Insights reads a rolling 28 days, Shopify's summary 30. Use the Over Time annotation as your before and after marker and give it a few weeks.

## The rule I apply

Every script on a storefront has to answer two questions: which page needs it, and what it costs on the main thread. If it can't answer both, it doesn't get to sit on the product page.

If you'd rather have someone run this diagnosis for you, that's the kind of work I do.

## Sources

- [HTTP Archive Web Almanac 2025: Performance](https://almanac.httparchive.org/en/2025/performance)
- [HTTP Archive Web Almanac 2025: Ecommerce](https://almanac.httparchive.org/en/2025/ecommerce)
- [HTTP Archive Web Almanac 2024: Performance](https://almanac.httparchive.org/en/2024/performance)
- [Fudge: State of Shopify Performance 2026 (July 2026)](https://www.fudge.ai/blog/state-of-shopify-performance-2026/)
- [Shopify Help Center: Web performance reports](https://help.shopify.com/en/manual/online-store/web-performance/web-performance-reports)
- [Google: About PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/about)
- [web.dev: Interaction to Next Paint](https://web.dev/articles/inp)
- [web.dev: INP becomes a Core Web Vital on March 12](https://web.dev/blog/inp-cwv-march-12)
- [Chrome DevTools: Performance panel overview](https://developer.chrome.com/docs/devtools/performance/overview)
- [Chrome DevTools: Performance features reference](https://developer.chrome.com/docs/devtools/performance/reference)
- [Chrome DevTools: Coverage](https://developer.chrome.com/docs/devtools/coverage)
- [Chrome for Developers: Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames)
- [web.dev: Optimize long tasks](https://web.dev/articles/optimize-long-tasks)
- [web.dev: Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [Shopify.dev: image_tag filter](https://shopify.dev/docs/api/liquid/filters/image_tag)
- [Shopify.dev: section object](https://shopify.dev/docs/api/liquid/objects/section)
- [Shopify.dev: App blocks for themes](https://shopify.dev/docs/storefronts/themes/architecture/blocks/app-blocks)
- [Shopify.dev: Built for Shopify requirements](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)
- [Shopify.dev: Storefront performance for apps](https://shopify.dev/docs/apps/build/performance/storefront)
- [Shopify Dawn: image-banner.liquid](https://github.com/Shopify/dawn/blob/main/sections/image-banner.liquid)
