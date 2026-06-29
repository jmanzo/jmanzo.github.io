---
title: "Building a Modern Shopify Theme App Extension with Preact, Volt, and TypeScript"
description: "How I built a fast, maintainable Shopify theme app extension with Preact, Volt, and TypeScript while staying under the 10MB deployed-extension size limit."
pubDate: 2025-07-11
tags: ["ai", "case-study", "shopify"]
---
[![The Nuflorist flower shop app on the Shopify App Store](../../assets/blog/building-a-modern-shopify-theme-app-extension-with-preact-volt-and-typescript/Nuflorist-The-Flower-Shop-App.png)](https://apps.shopify.com/nuflorist)

Building Shopify theme app extensions with just Liquid can become messy and heavy quickly, especially when you want a slick, interactive UI, or when the [10MB Shopify size limit for deployed extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#file-and-content-size-limits) is a priority in your case.

Recently, in the Nuflorist app, I was assigned to go all-in with [Preact, Volt (Vite plugin for Shopify), and TypeScript](https://shopify-vite.barrelny.com/guide/example-projects.html). Impressively, I got a maintainable, fast, and developer-friendly extension that feels like a native feature of the store.

This post breaks down the key steps and lessons from building it as one of my portfolio pieces and a practical guide for anyone looking to level up their [Shopify Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration) game.

## Some Insights:

#### **Why Preact + Volt + TypeScript?**

#### **Preact:** Tiny, React-like, and perfect for embedding in Shopify themes without bloating the bundle. [Preact](https://preactjs.com/) is a “3kb alternative to React with the same modern API”, as they say (and it’s true).

#### **Volt:** The Vite plugin that makes modern frontend tooling (hot reload, ES modules, etc.) play nice with Shopify’s extension systems. I think it was initially created for Themes, but it works excellently for Shopify App Extensions with some small configurations. [Docs & examples](https://shopify-vite.barrelny.com/) here.

#### **TypeScript:** Because type safety is a lifesaver, especially as your extension grows.

#### **Project Setup: The Essentials**

#### **Scaffold the extension:** In my case, I already had an existing Cart Widget with an existing structure and implementation made with Liquid originally. But for a use from scratch, you need to use the Shopify CLI to generate a new theme app extension.

#### **Volt config:** Set up _**vite.config.ts**_ in the extension folder, following the Volt docs. This handles asset bundling and injects your JS/CSS into the theme.

#### **TypeScript everywhere:** Configured _**tsconfig.json**_ for strict type checking and smooth Preact integration.

#### **Folder structure:** Kept things organized with **_/frontend/components_**, **_/frontend/entrypoints_**, **_/frontend/styles_**, etc.

#### **Entrypoint: Where Preact Meets Shopify**

#### **Single Entrypoint:** All JS and CSS for the extension are stored in _**frontend/entrypoints/theme.ts**_.

#### **Global styles first:** Imported resets and utility CSS before component styles to avoid specificity headaches. Any frontend project or implementation should start with a _**reset.css**_. I like using reset configurations even with Typescript, and I like to use [the Matt Pocock one](https://www.totaltypescript.com/ts-reset).

#### **Mounting the widget:** Registered a custom element (e.g., _**<nu-cart-widget>**_) that Preact renders into, making it easy to drop into any Liquid block.

#### **Component Architecture: Clean, Modular, and Fast**

#### **BEM + CSS Modules:** Used CSS Modules for component styles, following BEM naming for clarity and maintainability.

#### **Preact context & signals:** Managed state (like cart data, form fields) with Preact’s context and signals for real-time updates.

#### **Third-party integration:** Wrapped external libraries (like _**AirDatepicker**_) in Preact components. Additionally, I left a global configuration that allows me to add more external libraries later, which is great.

#### **Liquid Integration: Passing Data the Right Way**

#### **Props from Liquid:** Passed JSON-encoded settings and metafields from Liquid into the custom element as attributes. _However,_ I might opt for a _**window**.Nuflorist.var_ syntax in the future. What do you think? Would it be easier to read or efficient? For some reason, I believe this would be a better approach, but you know the saying: “It’s better done & working, than perfect”.

#### **Dynamic rendering:** Used these props in Preact to render UI based on merchant-configured data (occasions, messages, addons, etc.).

#### **Development Workflow: Fast Feedback, Easy Deploys**

#### **Hot reload:** Thanks to Volt + Vite, changes in _**TSX/CSS**_ show up instantly in the Shopify theme editor.

#### **Build & deploy:** Ran > _**npm run –workspace=theme-nuflorist**_ _**build**_ to generate production assets, then Shopify app deploy to push updates live. I faced some issues during this phase that I’d like to discuss in more detail.

#### **Lessons Learned & Pro Tips**

-   **CSS order matters:** Always import global styles before component styles in your entrypoint. Otherwise, there will be conflicts with styling everywhere.

-   **Type everything:** TypeScript catches so many bugs before they hit production, and this is a complaint with AI. No matter how many rules I added to my Cursor tool, TS code generation is still BS\*it, seriously. Ensure that you constantly review your code, make adjustments, and fix any issues before accepting or committing. Otherwise, you’ll end up with A LOT of assertions, any statements, potential runtime errors, and so on.

-   **Volt is a game-changer:** If you’re still using Webpack or manual asset management, give Volt a try.

-   **Liquid is still king for data:** Use it to pass dynamic data, but let Preact handle the UI. Our goal here was to decrease the size of the whole extension, so Shopify doesn’t complain about new future additions or features. This enables us to grow, scale, and improve more efficiently.

## Let’s talk about Vibe Coding Hype.

As a developer, my role has been mainly delegated to a tech lead-like role nowadays. I’m not coding as I had been doing it a decade before. However, I’m quite sure that without all this experience, today would have been a lot more uncomfortable.

Software development today doesn’t require an army of junior developers reading, refactoring, and playing with entire codebases. Any sufficiently skilled developer can today be the equivalent of a 5-person-sized pot team.

So, I’ll be honest and explain exactly how I initially prompted this requirement, so I could gather enough traction and information to complete the integration in a matter of a few days.

```
You are a web developer agent, an expert in building Shopify applications using the Remix, Prisma, and TypeScript stack. You can only terminate your turn when you are sure that this request is solved or when you have doubts. You'll prefer asking questions before making up a response.I want to migrate my entire @cart-widget.liquid block extension and its functionality in @cart-widget.ts to a Preact, Volt, TS, and Web Component implementation. Deeply check and follow the guidelines explicitly detailed here:- @https://shopify-vite.barrelny.com/guide/example-projects.html- @https://github.com/montalvomiguelo/theme-extension-vite- @https://github.com/barrel/shopify-vite/tree/main/examples/preact-shopifyHelp me create a well-defined action plan outlining the phases and steps, including potential commit points in the code. We will make these changes ourselves, step by step, with your full support as an agent only when I explicitly request it. The plan MUST be a series of markdown files named by phase following this pattern: 01_Phase_FileName.md, 02_Phase_FileName, etc. All will be placed on the root project.Rules:- You MUST NOT make changes to the code unless I authorize or explicitly request it.- DO NOT commit phases or steps. Finalize your turn and suggest the commit so I can apply it by myself.Analyze all related and necessary code to complete your assignment or understand the scope of the request.If you are not sure about file content or codebase structure pertaining to the user’s request, use your tools to read files and gather the relevant information: do NOT guess or make up an answer. You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls. DO NOT do this entire process by making function calls only, as this can impair your ability to solve the problem and think insightfully.
```

_1st prompt was made with Claude Sonnet. Within the context, I passed the Shopify documentation, some more folders, and info._

With this prompt, I ensured several things that will allow my AI response to be as clear, exact, and accurate as possible, providing the following:

1.  **Strong Rules:** These rules enforce planning, type safety, linting, and test coverage, making the AI behave like a clean, accountable junior developer. From time to time, you’ll see AI making the same mistakes repeatedly, which presents a valuable teaching opportunity. Cursor has a feature that will generate new rules based on the conversation, which will then be used alongside your existing `.cursor` rules.
2.  **Wide Context:** AI suffers from amnesia. It requires the right context to provide what you want, and it’s not particularly adept at automatically determining the necessary context.
3.  **Top Model:** Use the best available: **Claude Opus 4**, **Sonnet 4**, **Gemini 2.5 Pro**, or **o3‑pro**. Always run them in “thinking” mode. Don’t sacrifice quality for cost. Your time is far more valuable than token savings.

Prompting is everything. A good prompt enables the AI to function as a competent junior developer. A bad prompt turns it into a hallucinating liability. If you’re going to vibe code, you need to master the art of clear, directive communication.

After this prompt, I got exactly what I requested. With those files, I could check, polish, and re-prompt every phase all the way until I completed the whole migration.

### You can find the repo here:
[https://github.com/jmanzo/theme-preact-demo](https://github.com/jmanzo/theme-preact-demo)

### The Power of AI-Assisted Development

The journey from a traditional _Liquid + vanilla JS_ approach to a modern _Preact + Volt + TypeScript_ stack not only upgraded our tech stack but also allowed me to leverage, understand, and acknowledge AI as a true development partner.

By providing clear, structured prompts with specific rules and context, I was able to transform what could have been a months-long refactoring project into a focused, efficient implementation that maintained code quality and performance standards.

What makes this approach particularly powerful is how it scales. The same prompting principles that guided the migration of this Shopify extension can be applied to any project. Whether you’re building React components, setting up CI/CD pipelines, or debugging complex state management issues, having an AI that understands your coding standards, project structure, and business requirements means you’re not just coding faster, you’re building better software from the start. BUT, you’ll need to be very organized and a heavily structured thinker.

### Where’s the future going?

Honestly, I don’t know. Anyone with a mental health will respond this. But…

As Shopify continues to evolve with features like Hydrogen, Remix, and advanced app extensions, developers who master AI-assisted development will have a significant advantage. The combination of modern tooling like Volt, type-safe languages like TypeScript, and AI that understands your specific context creates a development environment where innovation isn’t just possible but inevitable. The key is starting with the right foundation:

-   Clear communication,
-   Structured rules, and
-   A commitment to quality that your AI partner can understand and execute consistently.

## Result or Impact?

Migrating to a Preact + Vite (Volt) stack yielded significant improvements in user and developer experience. Here are some of the most impactful results:

-   **Dramatically Reduced Bundle Size:** By switching from React to Preact, the JavaScript bundle size for the extension dropped by up to 80%. This means faster load times for customers and less bandwidth usage.

-   **Lightning-Fast Hot Reloads:** Vite’s development server enables near-instant hot module replacement, reducing developer feedback loops from several seconds to under 500ms. This accelerates feature development and bug fixing.

-   **Improved Time-to-Interactive:** The optimized build output and smaller runtime footprint result in a noticeably faster time-to-interactive for the cart widget, especially on mobile devices and slower networks.

-   **Lower Memory Usage:** Preact’s lightweight virtual DOM and efficient diffing algorithm reduce memory consumption, making the widget more stable on resource-constrained devices.

-   **Seamless Integration with Shopify:** The use of custom elements and Volt’s Vite plugin ensures that the extension loads only when needed, avoiding unnecessary JavaScript execution on unrelated pages.

-   **Better Lighthouse Scores:** After migration, Lighthouse audits showed improved scores in Performance, Accessibility, and Best Practices, reflecting a more robust and user-friendly experience.

-   **Developer Productivity Gains:** The modern toolchain (TypeScript, Vite, CSS Modules) and instant feedback loops led to a more enjoyable and productive development process.
