---
title: "Cursor AI & Shopify: What’s Worked for Me (and Hasn’t)"
description: "What building real Shopify projects with Cursor and LLMs taught me: where AI speeds you up, where it slows you down, and the habits that keep code shippable."
pubDate: 2025-09-03
tags: ["ai", "shopify"]
---
After months of pushing hard with Cursor + LLMs on real projects, this is what I’ve learned so far: what AI truly accelerates, where it quietly slows you down, and the habits that have kept my code fast, correct, and shippable (all of it without spending a lot of money because of useless code).

I’ve been working with Shopify Apps for a while as a Senior Developer, and it’s a great use case where AI is challenged. Shopify apps are made of several pieces that need to work thoroughly to work smoothly.

Of course. I won’t talk about vibe-coding here, because it’s not the case this time. My topic in this post is solely about getting a production-ready app working without issues. You know, with servers, DevOps, real databases, etc.

Also, I know. Technology improves a lot every day, so this can change in the near future. A new model and new research unlock a bigger potential, etc.

So, once that’s clarified, let’s move on.

### **1) The bigger the scope, the more human supervision I’ve needed**

AI scales ideas, but it still trips on nuance and changing requirements. The more “architecture” and cross-cutting concerns a task has (data model, auth, side effects, platform quirks), the more I treat AI like a junior pair. Great for drafts and scaffolding, but never for final work.

**Key:** delegate micro-tasks; own the orchestration until complete.

### **2) TypeScript isn’t optional**

TypeScript catches the dumb stuff before runtime and makes LLM output safer to integrate. Static checking plus inference reduces the surface area for hallucinations to become production bugs. If you’re building Shopify apps, TS fits naturally into [Functions](https://shopify.dev/docs/apps/build/functions/programming-languages?utm_source=chatgpt.com) and [Remix templates](https://github.com/Shopify/shopify-app-template-remix?utm_source=chatgpt.com) anyway.

Most likely, if you avoid assertions, “any” statements, and other tricky stuff AI-generated, everything is gonna be ok.

Specifically, I’ve seen how the AI struggles with certain TS scenarios, such as forcing assertions or using insecure “any” statements, or simply letting TS inference happen by default when not convenient.

That makes me happy because I can practice a lot of what I’ve been learning with [TotalTypescript Academy](https://www.totaltypescript.com/) (thanks, Matt Pocock), and also makes me happier because I have more control over what is being generated. At the same time, I ensure that everything is bulletproof.

### **3) Tokens are money**

Truths: _(1)_ API usage is billed **per token**; _(2)_ loading giant folders and long prompts burns tokens fast.

**Keep prompts short, stage work in steps, and pass only the minimal files needed**. Cursor’s “Full folder content” can be useful and tempting, but it explicitly increases request cost. Use it surgically.

This is more important today since I think that the whole AI Bubble has started to burst. Absolutely every AI provider and platform is increasing their prices. So, be careful with context and check the Pricing Plan of your preferred provider constantly. You don’t want an undesired surprise vibe-coding.

I know people who burned $1k to get a barely decent and buggy MVP, which I’m pretty sure wasn’t necessary at all.

_Calling your attention_: Whatever you use (Cursor, Kiro, Windsurf, etc), check their pricing and terms and conditions pages. Prices and/or benefits from 3 months ago to now couldn’t be the same as when you acquired them.

**Key:** Summarize, chunk, and iterate. If a prompt feels “heavy,” it probably is.

### **4) Split work into phases and capture context in Markdown**

My happiest implementations run like a relay:

-   Phase briefs in small _.md_ files (context the model _must_ know).
-   Tight checklists for each sub-task.
-   One outcome per prompt.

Cursor works with [explicit context](https://docs.cursor.com/guides/working-with-context?utm_source=chatgpt.com) and project rules. I use `_.cursor/context_` to store context _.md_ files, which I split between phases and steps.

My own observation on this: _**long context files tend to make the model slower**_. I keep “phase briefs” under a few hundred words and link to code instead of pasting it. When I truly need bulk, I chunk it and add one chunk per prompt or separate it into smaller steps.

[OpenAI’s own guidance](https://platform.openai.com/docs/guides/prompt-engineering?utm_source=chatgpt.com) favors concise, stepwise prompting over giant walls of text.

If you do this right, it’ll be critical when the chat’s context is full and you need to open another one. Remember, when a certain amount of tokens is reached, _**the needle-in-a-haystack issue**_ appears and becomes inefficient.

Sometimes, the model will generate another _.md_ file with a summary of what has been done. I love it because it allows me to increase the available context and details for future fixes, implementations, or just moving forward.

**Key:** If you can’t skim a context file in 30 seconds, it’s too big.

### **5) What I track in Git**

I version the _reusable_ bits (like `.cursor/rules`) and ignore the ephemeral stuff.

Cursor respects your `.gitignore`, and you can add a `.cursorignore` to keep noisy or sensitive files out of indexing, but in general, Cursor is good enough to determine [which files can be and cannot be indexed](https://docs.cursor.com/context/ignore-files?utm_source=chatgpt.com).

For theme and app code, [Shopify’s own guidance](https://shopify.dev/docs/storefronts/themes/best-practices/version-control?utm_source=chatgpt.com) is clear: use _**Git/GitHub**_ and treat your theme/app like software (branch, commit, PR, release).

Version control for me is a non-negotiable. Without commits, AI-assisted sessions can quickly create issues. Commit small, branch often, PR early, then let Shopify’s GitHub integration keep theme changes traceable end-to-end.

This is foundational risk management, not bureaucracy.

BTW, I follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) patterns. Pretty useful because it allows for details that can be quickly referred to anytime. [Thanks, Miguel Angel](https://www.linkedin.com/in/miguelangelpro/), you taught me this valuable stuff.

**Key:** checkpoint after every “green” step.

### **6) Cursor rules are a force multiplier**

[Rules live](https://docs.cursor.com/guides/working-with-context?utm_source=chatgpt.com) in `.cursor/rules` and can be scoped to parts of your repo. Putting durable knowledge into **project rules** makes the model consistent across sessions without re-prompting every time, and allows you to keep a history of what is done in the moment (think of this history as a Human-AI readable, scalable context).

Any directive I’ll reuse (coding standards, API constraints, file layout, test skeletons) becomes a rule. Then I can explicitly pull them in (_@rules_) or auto-attach by glob. This replaces “vibe prompting” with repeatable guardrails.

**Key:** name rules by _intent_ (_api-contracts.mdc, function-patterns.mdc_) so they’re discoverable. And, if I’ve told the model the same thing twice this week, it becomes a rule.

### **7) “AI is like money”**

Used wisely, it amplifies leverage. Used poorly, it compounds risk. I budget tokens and attention the way I’d budget cash: invest where it compounds (boilerplate, transformations, test scaffolds), and cap spending on open-ended ideation.

I use another cheaper AI provider for ideation and clarification of concepts. Then, and only then, I start creating a context _.md_ file, wrapping my mind and concentrating it to understand, figure out, and implement in a written way the problem/idea I’m working on.

It sounds familiar to engineers, doesn’t it? As an engineer, you won’t be allowed to burn cash just because. At least that’s my ideal engineer path in mind (I acknowledge in government spending, this happens all the time, but anyways). You get my point.

### **8) About automated tests (don’t trust green by default)**

Cursor often generates lovely test shells and scenarios. Really, I love how it works for me, but they can be misleading for the wrong reasons (over-mocking, shallow assertions).

I treat AI-generated tests as drafts, then harden them: meaningful assertions, realistic fixtures, failure cases, and at least one end-to-end path [with Playwright](https://playwright.dev/docs/best-practices?utm_source=chatgpt.com).

Shopify’s ecosystem and Playwright both provide solid testing guidance. Use them A LOT.

**Checklist I use:**

-   \[ \] Would this test fail if the code were broken in the obvious way?
-   \[ \] Do I assert _observable behavior_, not implementation details?
-   \[ \] Is there one “canary” E2E that touches the real integration?

### **9) Speed: where AI helps and doesn’t**

Research shows real productivity gains in [specific tasks](https://www.microsoft.com/en-us/research/publication/the-impact-of-ai-on-developer-productivity-evidence-from-github-copilot/?utm_source=chatgpt.com) (e.g., Copilot users finished a controlled JS server task ~56% faster), but results vary by complexity and team maturity.

In my work, selective use wins: I get speed on boilerplate, refactors, and content transforms; I slow down if I offload core design or tricky integration logic.

Especially with Shopify Apps, where there are a lot of platforms, libraries, and other stuff involved. Trying to get the model or Cursor to understand and operate at first is super hard (not to say impossible).

Even with the [Shopify MCP server](https://shopify.dev/docs/apps/build/devmcp) working and operating, teaching the model to handle or figure out what you’re trying to do and not hallucinate is difficult.

With boilerplate routes in Remix, I saved A LOT of time. But when I tried a complex Function with discount logic, I lost more time debugging hallucinations than if I had started from scratch.

**Key:** the newer, bigger, or riskier the code path, the more I rely on my own reasoning and the more I use AI as a reviewer, not an author.

* * *

AI didn’t replace my developer judgment; actually, it made it more expensive to skip. I later inherited a theme that showed exactly what skipping it costs: [2,448 lines of AI-written code pasted into a single Liquid template](/blog/ai-generated-code-technical-debt/). The teams that win on Shopify will be the ones that use AI deliberately: small prompts, typed code, tight tests, and relentless version control.

That’s the craft.

Honestly, I enjoy programming and learning a lot. I have a curiosity about all tech-related stuff. So, don’t blame me if I get it wrong, so far, but those are my findings regarding this relatively new field. If you know something I don’t, or you know how to do something better, please share with me.

We are all just learning. Thanks for reading.

### **References & further reading**

-   [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/basic-types.html?utm_source=chatgpt.com) (why static checking prevents runtime surprises).
-   Shopify: [Functions language support](https://shopify.dev/docs/apps/build/functions/programming-languages?utm_source=chatgpt.com); [Remix app template](https://github.com/Shopify/shopify-app-template-remix?utm_source=chatgpt.com); GitHub integration for themes.
-   OpenAI: [pricing is per-token](https://openai.com/api/pricing/?utm_source=chatgpt.com); [prompt-engineering best practices](https://platform.openai.com/docs/guides/prompt-engineering?utm_source=chatgpt.com).
-   Cursor docs: [Working with context](https://docs.cursor.com/guides/working-with-context?utm_source=chatgpt.com); Rules; Ignore behavior & .gitignore.
-   Cursor Pricing: [Latest changes and limitations included](https://cursor.com/pricing). PS: Monitor this weekly. That’s almost the frequency their changing and increasing their prices.
-   Testing: [Playwright best practices](https://playwright.dev/docs/best-practices?utm_source=chatgpt.com); Shopify’s testing overview for ecommerce flows.
-   Productivity evidence (and nuance): [Microsoft/GitHub Copilot studies](https://www.microsoft.com/en-us/research/publication/the-impact-of-ai-on-developer-productivity-evidence-from-github-copilot/?utm_source=chatgpt.com); [mixed findings in field settings](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/?utm_source=chatgpt.com).
