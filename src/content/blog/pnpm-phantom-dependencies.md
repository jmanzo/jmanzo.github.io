---
title: "pnpm Didn't Break Your Build: Phantom Dependencies Did"
description: "A build that runs fine on npm breaks on pnpm with 'Module not found'. The real cause is phantom dependencies, and the one-line package.json fix."
pubDate: 2026-06-30
tags: ["pnpm", "javascript", "node"]
draft: false
---

A `pnpm run dev` died before the page even loaded:

```text
Module not found: Can't resolve '@emotion/react'
```

The same code had run fine on npm for months. The usual reaction is "pnpm is broken, switch back to npm." That is pulling the battery out of a smoke detector.

## What a phantom dependency is

The `package.json` declared `@emotion/server`. But the code imported `@emotion/react` and `@emotion/cache` directly. Those two were never declared. They only sat in `node_modules` because some other package pulled them in. That is a phantom dependency: a package you import but never installed.

## Why npm and yarn hide it

npm and yarn flatten the whole dependency tree into one `node_modules`, so any import resolves against anything that happens to be in there. Your import works by accident.

pnpm does not flatten. It builds [`node_modules` with symlinks](https://pnpm.io/symlinked-node-modules-structure), and code can only resolve what its own `package.json` declares. So the moment the repo touched pnpm, every phantom dependency surfaced at once.

## The fix

Not "go back to npm." One honest line per package you actually import:

```json
"dependencies": {
  "@emotion/react": "^11",
  "@emotion/cache": "^11",
  "@emotion/server": "^11"
}
```

Declare what you import. That is the whole fix.

## Why this is the failure mode you want

A phantom dependency is a time bomb. It works today and breaks the day a transitive dependency bumps its version or drops the package upstream. That failure shows up in CI, or a teammate's clone, or a Docker build, never on your machine, and it looks like black magic. pnpm turns that future mystery into a build error you get now, with the file and the missing package printed right there. A bug that fails immediately, next to its cause, is the one you want.

So when a repo runs on npm and dies on pnpm with `Can't resolve`, read it correctly. pnpm is not the problem. It is the first tool that refused to cover for a `package.json` that was already wrong.

If you run a JS codebase of any size, install it once with pnpm even if you never ship with it. Whatever fails to resolve is your exact list of phantom dependencies.

(Yes, the strict default occasionally fights legacy packages that lean on hoisting. That is what [`shamefully-hoist`](https://pnpm.io/settings) is for. The friction is the cost of correctness you postponed, not a flaw in the tool.)
