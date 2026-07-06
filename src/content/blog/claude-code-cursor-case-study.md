---
title: "The \"Live\" Badge Was Lying: Building With Claude Code and Cursor"
description: "A disaster-relief app for Venezuela, built in a week with Claude Code and Cursor: the Supabase RLS bug that almost shipped, and the real AI workflow behind it."
pubDate: 2026-07-06
tags: ["ai", "case-study", "supabase", "nextjs"]
draft: false
---

On June 24, 2026, an earthquake doublet (magnitude 7.2 and 7.5) struck north-central Venezuela. Its epicenter was in the states of Yaracuy and Carabobo, but the heaviest damage landed in the cities: Valencia, Maracay, Caracas, and La Guaira. Within days, collection centers opened everywhere, and the classic aid mismatch followed: one center drowning in bottled water it couldn't store while another ran out of gauze and baby formula. Nobody had a shared view of what each center actually needed.

I decided to build that view. This is what shipped, what broke, and what working with AI agents on a real deadline actually looks like.

## Killing my own MVP in 48 hours

Version 1 was a citizen incident tracker: anyone drops a pin, reports a need, anyone else marks it covered. It worked. It was also the wrong model. Ad-hoc reports rot fast, nobody owns them, and responders were already organized around collection centers, not map pins.

A single municipal center had published a simple "what to bring, what NOT to bring" board and it was working better than anything else I saw. So v2 threw away the incident model and generalized that idea: a shared catalog of about 100 relief products, and each center publishes a four-level stock semaphore per product. Critical, needs more, sufficient, well stocked. Centers self-register, an operator approves them, and each center keeps its own board current. Citizens check before they drive.

The lesson costs nothing to read and a lot to accept: shipping fast matters less than noticing fast that you shipped the wrong thing.

## The stack, chosen for boring reliability

Next.js 16 (App Router) with React 19 and TypeScript. Effect for the service layer: typed errors, dependency injection through layers, and a swappable data layer, which meant the app runs on an in-memory store when Supabase credentials are absent, so the demo URL is never blank. Supabase for Postgres and Realtime. Leaflet with OpenStreetMap tiles because disaster tooling should not depend on an API key. Tailwind, mobile-first, since everyone involved is on a phone. Vercel for hosting.

Auth is deliberately minimal: no accounts, no emails. One password per center (scrypt-hashed, chosen at registration, valid only after approval), one super-admin password, and a signed httpOnly session cookie that expires. Readers need nothing. Writers are gated server-side; the service-role key never reaches the browser.

## The bug that almost shipped

The public board had a green "Live" indicator. It was lying.

End-to-end testing caught it: with the board open, I changed stock statuses through the API and the DOM never moved. With the service key, events arrived. With the anon key, nothing.

Root cause: the row-level security policy on `product_status` used an `EXISTS` subquery against `centros_acopio` to check the center was approved. But `centros_acopio` had RLS enabled with no read policy at all, and policy subqueries run with the permissions of the querying role. For anonymous users the `EXISTS` was always false. PostgREST returned an empty array, and Realtime filtered out every event. No error anywhere. Just silence, under a badge that said "Live".

The fix was a `security definer` function (`centro_is_approved()`) and a recreated policy. One migration, verified end to end: an open public board reflected a status change with no refresh.

That RLS design (anon can't read `centros_acopio` at all) is also why admin password hashes can never leak to the browser. The same property that caused the bug is a feature everywhere else.

## What the AI workflow actually was

I'll be specific, because "built with AI" usually isn't. It looked a lot like the Cursor workflow I described in [what's worked for me (and hasn't)](/blog/cursor-ai-shopify-whats-worked-for-me-and-hasnt/), just applied to a Supabase backend instead of a Shopify storefront.

I wrote PRDs as build contracts: data model, flows, acceptance criteria, explicit out-of-scope lists. Cursor agents executed them milestone by milestone, and pushed back with real design questions before writing code: should center-created products go into the global catalog? Which license fits a non-profit tool? Do you understand that purging files from git history force-pushes a public repo? It prepared the destructive commands but refused to run them against a dirty tree, and left the force-push to me. Correct call.

Claude Code did the adversarial pass: a full code review plus end-to-end testing against real Supabase before launch. That pass produced three blockers, including the Realtime bug above, insecure secret fallbacks in production, and session tokens that never expired. All fixed and re-verified before the app was promoted to a single center.

The honest summary: the agents wrote most of the code. My job was product judgment, architecture constraints, review, and refusing to launch on a lying "Live" badge.

## Where it stands

The app is live at [centros-de-acopio-ven.vercel.app](https://centros-de-acopio-ven.vercel.app/). Centers register themselves at `/registrar`, get approved, and manage their own board from a phone. The code is open source under AGPL-3.0 at [github.com/jmanzo/centros-de-acopio-ven](https://github.com/jmanzo/centros-de-acopio-ven): free, non-profit, and copyleft so it stays that way.

If you know a collection center in Venezuela, the registration takes five minutes. If you're a developer, the RLS-plus-Realtime failure mode alone is worth reading the migration for. It will bite anyone combining Supabase Realtime with policies that subquery other RLS-protected tables.

(Caveat: lightweight password auth and per-instance rate limiting are pragmatic choices for a volunteer-run relief tool, not a template for apps with real accounts and adversaries.)
