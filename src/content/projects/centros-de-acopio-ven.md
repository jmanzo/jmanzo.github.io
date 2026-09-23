---
title: "Centros de Acopio Ven: a stock board for disaster-relief collection centers"
description: "Built in a week after the June 2026 earthquake in Venezuela: each collection center publishes a four-level stock status per product so donors know what to bring, and what not to."
tier: more
order: 30
kind: "Own project"
client: "Volunteer project"
engagement: "Built solo, open source"
role: "Sole developer"
period: "2026"
status: "Shipped in one week"
stack: ["Next.js 16", "React 19", "TypeScript", "Effect", "Supabase", "PostgreSQL", "Realtime", "Leaflet", "Tailwind CSS", "Vercel"]
links:
  - { label: "Source on GitHub", href: "https://github.com/jmanzo/centros-de-acopio-ven" }
related: ["claude-code-cursor-case-study"]
cover: "../../assets/projects/centros-cover.jpg"
coverAlt: "Illustration of a map of Venezuela with collection-center pins and a phone showing a logistics checklist"
---

## What it is

After the earthquakes of June 24, 2026 in north-central Venezuela, collection centers opened everywhere, and the usual mismatch followed: one center drowning in water it couldn't store, another out of gauze. This app gives each center a public board with a stock status per product (critical, needs more, sufficient, well stocked) so people check before they drive. Centers self-register, an operator approves them, and each center keeps its own board current. The interface is in Spanish.

## Worth a look

- **I threw away the first version in 48 hours.** It was a citizen incident map, and it was the wrong model. The second version generalized what one municipal center was already publishing by hand.
- **An Effect service layer** with typed errors and a swappable data layer: without Supabase credentials it runs on an in-memory store, so the demo is never empty.
- **Security kept small on purpose.** No accounts: one scrypt-hashed password per center, valid only after approval, and a signed session cookie. The anonymous key can only read realtime updates under row-level security; every write goes through the server.
- **The "Live" badge that was lying.** End-to-end testing caught that realtime updates never reached the page even though the indicator said they did. The write-up covers the RLS bug behind it and the AI-assisted workflow.
