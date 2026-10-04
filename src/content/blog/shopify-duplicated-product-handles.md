---
title: "Duplicated Shopify Products Keep the Wrong URL. Here's the Bulk Fix."
description: "Duplicating a Shopify product leaves handles like copy-of-x or x-1 that never update on rename. What breaks for SEO, and a script to bulk-fix them with 301s."
pubDate: 2026-10-04
tags: ["shopify", "seo", "graphql", "admin-api", "redirects"]
heroImage: "../../assets/blog/shopify-duplicated-product-handles/hero.png"
heroImageAlt: "Card titled Duplicated products keep the wrong URL, with four steps: set once, find them, rename plus 301, clean the rest"
draft: false
---

I keep seeing the same thing across the merchants I work with. Someone needs a new product, there's a similar one already in the catalog, so they hit Duplicate, change the title, swap a few images and publish.

The product page looks perfect. The URL doesn't. It's still `/products/copy-of-classic-tee`, or `/products/classic-tee-1`, or the handle of a completely different product with a new title sitting on top of it.

Nobody notices because nothing breaks. The page loads, the add-to-cart works, the theme doesn't care. It just quietly sends the wrong signals to Google and to every human who reads the link.

## Why the handle never catches up

This isn't a bug. It's documented behavior, and once you read it the whole problem makes sense. From Shopify's own docs:

- Handles are generated from the product title: lowercase, special characters and spaces replaced with a single hyphen.
- Handles must be unique, so if a title is already taken, the handle is auto-incremented. Two products called Potion get `potion` and `potion-1`.
- **After a product has been created, changing the title doesn't update the handle.**

That last line is the whole story. The handle is written once, at creation, from whatever title the product had at that moment. When you duplicate, the new product is created with the title in the duplicate dialog. Keep the original title and you get a numbered suffix. Keep a "Copy of" style title, which is what merchants report seeing in that field, and you get a `copy-of-` prefix. Rename the product five minutes later and the handle stays exactly where it was.

## What else rides along with a duplicate

The handle is the visible symptom. Shopify's help center says that when you duplicate a product, all product details except 3D models and videos are copied to the duplicate, with options for what to include. Back in 2020 Shopify added options to copy SKUs, barcodes and inventory quantities alongside images.

In practice that means the duplicate can inherit:

- **The search engine listing.** If the original had a custom SEO title and meta description, the duplicate now has the same ones. Two products, one snippet in search results, pointing at different URLs.
- **Metafields.** Size charts, care instructions, specs, anything driven by metafields shows the old product's values until someone updates them. (The API's `productDuplicate` mutation notes one exception: metafield values with the unique values capability aren't duplicated.)
- **Image alt text.** If you copy the media, the alt text describes the original product.
- **SKUs and barcodes**, if those boxes were ticked. Two products sharing a barcode is a problem for inventory systems and for product feeds that rely on GTINs.

## The SEO impact, honestly

I won't pretend a `-1` in a slug tanks a store. It doesn't. But the costs are real and they stack:

**Mismatched slugs.** Google's own URL guidance is to use readable, descriptive words. `/products/copy-of-linen-shirt-white` on a product titled "Linen Shirt, Navy" is readable and wrong. Shoppers see it in search results, in shared links, in ads.

**Near-duplicate pages.** A duplicate that keeps the original's description, SEO title and meta description is a second page saying the same thing. When Google sees duplicate content it picks a canonical on its own, and it might not pick the one you want ranking.

**Broken links when you fix it badly.** Rename the handle without a redirect and the old URL becomes a 404. Every backlink, every saved link, every ad pointing there is now dead. This is the part that turns a cosmetic issue into a real one, which is why the fix always comes with redirects.

## Fixing one product in the admin

For a handful of products the admin is fine. Open the product, go to the search engine listing section, edit the URL handle, and make sure **Create a URL redirect** is checked before you save. That option sends the old URL to the new one. Then fix the SEO title, meta description, alt text and metafields while you're there.

Redirects live under **Content > Menus > URL redirects** in the current admin (older guides still say Online Store > Navigation). From there you can also import redirects in bulk from a CSV using Shopify's template. Two rules worth knowing: a redirect only fires when the old URL is actually broken, and standard plans cap out at 100,000 redirects (Plus goes to 20,000,000).

One trap: don't try to rename handles with the product CSV import. The product CSV matches rows to existing products by handle, so it's the wrong tool for changing one.

## Fixing hundreds with the Admin API

When it's a catalog problem, script it. The GraphQL Admin API's `ProductUpdateInput` takes the new `handle` plus a `redirectNewHandle` boolean. Set it to `true` and Shopify redirects the old handle to the new one for you. One mutation per product, no separate redirect call.

```graphql
mutation RenameHandle($product: ProductUpdateInput!) {
  productUpdate(product: $product) {
    product { id handle }
    userErrors { field message }
  }
}
```

```json
{
  "product": {
    "id": "gid://shopify/Product/1234567890",
    "handle": "linen-shirt-navy",
    "redirectNewHandle": true
  }
}
```

Here's the script I'd run. It pages through every product, flags handles that look duplicated (`copy-of-...`, `...-copy`, `...-1`) and don't match the current title, and prints the plan. Nothing changes until you pass `--apply`.

```js
// fix-handles.mjs (Node 18+). Needs read_products and write_products.
// SHOP=store.myshopify.com TOKEN=shpat_xxx node fix-handles.mjs [--apply]
const { SHOP, TOKEN } = process.env;
const APPLY = process.argv.includes("--apply");
const ENDPOINT = `https://${SHOP}/admin/api/2026-10/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// Approximates Shopify's rules: lowercase, runs of other chars -> one hyphen.
const toHandle = (title) =>
  title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const SUSPECT = /^copy-of-|(^|-)copy(-\d+)?$|-\d+$/;

const PRODUCTS = `query ($cursor: String) {
  products(first: 250, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    nodes { id title handle }
  }
}`;
const UPDATE = `mutation ($product: ProductUpdateInput!) {
  productUpdate(product: $product) {
    product { handle }
    userErrors { field message }
  }
}`;

const targets = [];
let cursor = null;
do {
  const { products } = await gql(PRODUCTS, { cursor });
  for (const p of products.nodes) {
    const wanted = toHandle(p.title);
    if (wanted && p.handle !== wanted && SUSPECT.test(p.handle)) {
      targets.push({ ...p, wanted });
    }
  }
  cursor = products.pageInfo.hasNextPage ? products.pageInfo.endCursor : null;
} while (cursor);

for (const p of targets) {
  console.log(`${p.handle} -> ${p.wanted}`);
  if (!APPLY) continue;
  const { productUpdate } = await gql(UPDATE, {
    product: { id: p.id, handle: p.wanted, redirectNewHandle: true },
  });
  for (const e of productUpdate.userErrors) console.error(`  skipped: ${e.message}`);
}
console.log(`${targets.length} handle(s) ${APPLY ? "processed" : "flagged (dry run)"}`);
```

A few things I'd check before running it with `--apply`:

- **Read the dry run.** A `-1` handle isn't always a mistake. If two live products genuinely share a title, the rename fails: since API version 2025-01, `productUpdate` validates handle uniqueness and returns a user error instead of silently incrementing. That error is useful. It tells you two products have the same name, which is its own problem.
- **Non-English titles.** The `toHandle` function approximates Shopify's rules. For accents and non-Latin scripts, eyeball the proposed handles.
- **Large catalogs.** The script runs mutations one at a time, which stays well inside rate limits for hundreds of products. For thousands, add a retry on throttling.
- **Hardcoded links.** Redirects catch the old URLs, but theme code, menus or metafields that reference products by handle should be updated to the new one.

## Stop it at the source

The cleanup is a one-time job. The habit is what keeps it from coming back: when you duplicate, type the real title in the duplicate dialog before you confirm, then open the search engine listing and check the handle, SEO title and description before the product goes live. Thirty seconds per product, against a cleanup script and a pile of redirects later.

If you'd rather have someone audit and fix this across your catalog, that's the kind of work I do.

## Sources

- [Shopify Help Center: Adding and updating products (duplicate a product)](https://help.shopify.com/en/manual/products/add-update-products)
- [Shopify Changelog: Have more control when you duplicate products](https://changelog.shopify.com/posts/have-more-control-when-you-duplicate-products)
- [Shopify Liquid docs: Handles](https://shopify.dev/docs/api/liquid/basics)
- [Shopify GraphQL Admin API: ProductUpdateInput](https://shopify.dev/docs/api/admin-graphql/latest/input-objects/ProductUpdateInput)
- [Shopify GraphQL Admin API: productDuplicate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/productDuplicate)
- [Shopify developer changelog: Handle uniqueness validation in productCreate, productUpdate and productSet](https://shopify.dev/changelog/posts/new-validation-against-duplicate-handles-in-productcreate-productupdate-and-productset-mutation-inputs)
- [Shopify Help Center: URL redirects](https://help.shopify.com/en/manual/online-store/menus-and-links/url-redirect)
- [Shopify Help Center: Adding and editing pages (Create a URL redirect option)](https://help.shopify.com/en/manual/online-store/add-edit-pages)
- [Shopify Help Center: Using CSV files to import and export products](https://help.shopify.com/en/manual/products/import-export/using-csv)
- [Google Search Central: URL structure best practices](https://developers.google.com/search/docs/crawling-indexing/url-structure)
- [Google Search Central: Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google Search Central: Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
