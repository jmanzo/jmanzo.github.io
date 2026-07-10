---
title: "I build storefronts for a living. My own blog was invisible to AI search."
description: "An SEO audit of my own blog found eleven posts with zero structured data. The one-file JSON-LD fix, and why your Shopify store probably has the same gap."
pubDate: 2026-07-10
tags: ["seo", "aeo", "json-ld", "structured-data", "shopify", "astro"]
draft: false
---

Last week I audited my own blog. Astro, static, fast, clean HTML. Canonical tags, meta descriptions and Open Graph all generated from front-matter. The kind of setup that passes every checklist.

Then I checked what the pages actually tell a machine. View source, search for `ld+json`.

Zero results. Eleven posts, zero structured data.

## Why zero structured data hides for years

Without JSON-LD, Google and AI answer engines like ChatGPT and Perplexity have to infer what a page is from raw HTML. Is this an article? Who wrote it? When? About what? They guess. Sometimes they guess wrong, and a wrong guess means your page loses to one that declared itself explicitly.

Here is why this stays hidden for years: nothing breaks. No error, no console warning, Lighthouse stays green. The page looks identical to humans. Structured data is the one layer of your site you never see unless you go looking for it.

## The one-file JSON-LD fix

The fix was one additive change in the post layout, not in each markdown file. Build a `BlogPosting` object from front-matter the posts already have:

```astro
---
const postUrl = new URL(`/blog/${post.id}/`, Astro.site).toString();
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: post.data.title,
  description: post.data.description,
  datePublished: post.data.pubDate.toISOString(),
  ...(post.data.updatedDate && {
    dateModified: post.data.updatedDate.toISOString(),
  }),
  author: { "@type": "Person", name: SITE.author, url: SITE.url },
  publisher: { "@type": "Person", name: SITE.author, url: SITE.url },
  mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  url: postUrl,
  ...(post.data.tags && { keywords: post.data.tags.join(", ") }),
};
---

<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

One file, eleven posts covered, every future post covered for free.

## Your Shopify store probably has the same gap

Now the uncomfortable part. If a developer's own 11-post blog had this gap, check your store.

Shopify themes emit basic Product JSON-LD out of the box: name, price, availability. That is where most stores stop. Blog articles, FAQ content, organization data, brand, SKU, shipping and returns info: usually absent unless someone added them on purpose. Meanwhile shopping is shifting toward AI agents that read your pages and decide what to recommend. A page that declares what it is gets cited. A page that makes the machine guess gets skipped.

The 30-second test: open your best-selling product page, view source, search for `ld+json`. If all you find is the theme default, or nothing, AI search is guessing what you sell.

The same discipline shows up in the rest of my [Shopify and AI development work](/blog/cursor-ai-shopify-whats-worked-for-me-and-hasnt/): the boring, invisible layers are usually the ones that decide whether the work actually ships value.

(Fair caveat: structured data makes you eligible, not guaranteed. [Google is explicit](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) that markup enables rich results without promising them. But eligible beats invisible.)

One last thing. The page you are reading right now went through that exact fix. View source, search for `ld+json`, and you will find this article declaring itself.
