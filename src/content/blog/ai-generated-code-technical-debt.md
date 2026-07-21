---
title: "2,448 Lines of AI Debt vs. 80 Lines That Held"
description: "Two AI-written fixes for the same Shopify variant sync bug. One pasted 2,448 inline lines into a template. The other was 80 lines. What made the difference."
pubDate: 2026-07-21
tags: ["ai", "shopify", "liquid", "code-review"]
heroImage: "../../assets/blog/ai-generated-code-technical-debt/hero.jpeg"
heroImageAlt: "Split illustration: a monitor tangled in red inline code on the left, a clean monitor with a robotic hand writing structured code on the right"
draft: false
---

A 7-figure store had a sticky cart bug: the variant selector kept going out of sync, and customers were getting the wrong size added to their cart.

When I took over the job, the bug had already been "fixed" once. The previous developer had run it through a free AI model and shipped whatever came back: 2,448 lines of JavaScript and CSS pasted directly into `main-product.liquid`. The template went from 574 lines to 2,261.

## The anatomy of an unsupervised AI fix

That diff is worth dissecting, because it is what unsupervised AI output looks like in production:

- Around 430 lines of inline CSS, force-applied with `!important` everywhere.
- Around 1,000 lines of inline JS reimplementing a sticky add-to-cart bar from scratch: 40-odd functions doing DOM mirroring, mutation observers, click-proxying.
- `console.log`s left in.
- Translations hardcoded inline instead of using locale keys.
- And the part that made it actively dangerous: a second form control with `name="id"` alongside the existing one, so the form now had two variant ID fields racing each other.

That last one is the exact class of bug they were hired to fix, reintroduced by the fix. The bug came back anyway.

Here's the uncomfortable part: I fixed it with AI too. Same category of tool. Radically different output. The difference came down to three decisions that happened before any code was written.

## Three decisions before any code was written

**First, context before prompts.** I didn't paste an error message into a chat and hope. I gave the model the requirement doc, the three relevant commits by SHA (the published baseline, the broken fix, my earlier hotfix), and the one constraint that explained everything: this theme's Tailwind is pre-compiled and the source isn't in the repo, so new utility classes silently don't exist. That single fact is why the previous fix was drowning in `!important`. It was fighting a missing `grid-cols-5` with brute force instead of asking why the class didn't work.

**Second, I answered the model's questions instead of skipping them.** Midway through analysis it stopped and asked: revert to the published dropdown, or rebuild the size grid and sticky bar cleanly? Scope to the PDP only, or touch everything the previous dev changed? Those answers changed the plan entirely. The requirement listed the grid and the sticky bar as acceptance criteria. The "obvious" revert would have deleted features the client had explicitly asked for.

**Third, the model chosen for the task, not for the invoice.** Not the cheapest, not reflexively the most expensive. One that plans before editing, holds a 2,000-line diff plus a requirement doc in context, and flags hazards it wasn't told about. It found the duplicate `name="id"` on its own. I hadn't reported it, because I hadn't seen it yet.

## What 80 lines looked like

The result was boring, which is the point:

```liquid
{% comment %} Before: 2,448 lines of <script> and <style> inline {% endcomment %}

{% comment %} After: {% endcomment %}
<script src="{{ 'variant-id-sync.js' | asset_url }}" defer></script>
```

An 80-line capture-phase submit guard as the single source of truth: resolve the variant from the checked radios at submit time, write it to the one hidden `input[name="id"]`, and the async race can no longer ship a stale ID. A server-rendered [sticky bar](/blog/elevating-user-experience-with-a-sticky-cta-a-case-study-on-a-7-figure-dtc-e-commerce-brand/) that drives those same radios instead of cloning DOM. A BEM stylesheet instead of inline `!important`. Locale keys instead of hardcoded strings.

## Verification before the PR, not after the complaint

Live browser tests on the preview theme, including the rapid-change race (70D -> 85D -> 90D submits the latest ID, every time), with every test submit intercepted and the cart confirmed empty afterward.

That step is not optional overhead. It's the only thing that separates "the model said it fixed it" from "it's fixed." I learned the same lesson the hard way [shipping a disaster-relief app with Claude Code and Cursor](/blog/claude-code-cursor-case-study/), where a security bug sailed past a green UI badge.

## The model was never the villain

The free model was never the problem here. The missing engineering in front of it was. AI multiplies the judgment you bring to it, and the previous fix multiplied by zero. Context, constraints, questions answered, verification demanded: that was the entire difference between a liability and a fix.

So if your next fix comes out of a model, ask yourself one thing before shipping: can you explain every line and why it exists? If you can't, you didn't fix the bug. You scheduled the outage.

(Free models are fine for plenty of tasks. The failure here wasn't the price tier. It was pasting a symptom into a chat with zero context and shipping the first answer that rendered.)
