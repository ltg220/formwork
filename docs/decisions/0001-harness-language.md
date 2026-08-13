# 0001 — Harness scripts are plain JavaScript

**Status:** accepted
**Date:** 2026-08-13

> This decision is about **keel itself**, not about any project built from it. `/keel-init`
> removes it when initialising a new repo.

## Context

keel's scripts (`gates.mjs`, `ratchet.mjs`, `doctor.mjs`) are the harness every project runs.
Two constraints shaped the choice of language:

1. **A fresh clone must be green with nothing installed.** `git clone && node
   scripts/gates.mjs` has to work. It is the first impression the template makes, and a
   template that fails before you have configured anything teaches you to distrust it.
2. **keel must serve projects in any language.** A Python or Go project should not need a
   TypeScript toolchain to run its own gates. The harness has to be lighter than everything it
   serves.

## Decision

Plain `.mjs`. No TypeScript, no build step, no dependencies. Node only.

## Options considered

### A — Plain JavaScript, `.mjs` (chosen)

Runs on any Node with zero install. Nothing to compile, nothing to keep in sync. The cost is
no static type checking on the harness itself.

### B — TypeScript with a build step (rejected)

Real type safety. But it needs `npm install` and a compile before the gates can run, which
breaks constraint 1 outright, and drags a Node toolchain into non-Node projects, which breaks
constraint 2.

### C — TypeScript via Node's native type stripping (rejected)

Node 24 runs `.ts` directly, so constraint 1 survives. But stripping **erases** types without
checking them — you would get TypeScript syntax and zero type safety unless `tsc` is installed
too, at which point it collapses into option B. Worst of both: the appearance of safety
without the substance.

### D — JSDoc annotations + `tsc --checkJs` (rejected for now)

Genuinely full type checking, and the runtime stays dependency-free — the gates still run on a
clean clone. Rejected only because `tsc` becomes a devDependency, so *developing* keel needs
an install even though *using* it does not. Not worth it at the current size.

## Consequences

- The harness has no compile step and no dependencies. It runs anywhere Node runs.
- The scripts are not type-checked. This is a real gap, mitigated by keeping them small
  (~150 lines each) and by `scripts/lib/config.test.mjs`, which pins the invariants that
  actually matter — tier cumulativity, bounded loop iterations, and that no tier can set
  `stopAt` to anything but `pr`.
- It looks inconsistent: a template that ships a typecheck gate, written without types. That
  appearance is the main cost, and is the reason this document exists.

## What would change our mind

Any one of these:

- The scripts pass roughly 500 lines total, where holding the shapes in your head stops working
- A type-related bug ships in the harness
- keel gains contributors who did not write it

Then take **option D** — JSDoc plus `tsc --checkJs`. It buys real checking while keeping the
zero-runtime-dependency property, which is the one thing that must not be traded away.

Do **not** take option B or C in response to the code merely *looking* untyped. That
appearance is the known cost recorded above, not a new discovery.
