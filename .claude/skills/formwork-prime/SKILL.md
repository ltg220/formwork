---
name: formwork-prime
description: Load context before working on an unfamiliar or long-untouched formwork repo. Reads the rulebook, current state, recent history, and code structure in the right order, then reports what it found and what it is unsure about. Run at the start of a session, before planning or implementing.
---

# formwork-prime

Load context, in the right order, before touching anything.

The failure this prevents: starting work with a partial picture, making a change that is
locally sensible and globally wrong, and discovering it three tasks later. Reading is cheap.
Unwinding is not.

## When to run

- Starting a session on a repo you haven't touched recently
- After someone else (or another session) has been working
- Before `/formwork-plan` on anything non-trivial
- Any time you notice you're guessing

Skip it for a one-line fix you already understand.

## Order matters

Read these in sequence. Each one changes how you read the next.

### 1. The rules — `CLAUDE.md`

What must never be broken here. Note the **tier**: it decides how much ceremony the work needs
and how hard review will be.

### 2. What's broken — `docs/known-issues.md`

Before assuming a bug is new, check whether it's known. Treat entries as **hypotheses** — they
record what someone believed when they wrote it, and a fair share are stale or misdiagnosed.

### 3. What happened — newest file in `docs/handoffs/`

Read the most recent one properly, and skim one or two before it. The "what did not work"
section is the highest-value paragraph in the repo: it is the only record of paths already
tried and abandoned.

### 4. Why it's built this way — `docs/decisions/`

Skim the titles. Read any that touch what you're about to change.

**This is the step that prevents the most wasted effort.** Proposing something already
recorded as rejected is the single most common way to burn an hour.

### 5. In-flight work — `docs/designs/`

Anything marked `building` is live work. Do not collide with it.

### 6. What green means — `docs/testing.md`

Then run it, so you know the starting state rather than assuming it:

```bash
node scripts/gates.mjs --list
node scripts/doctor.mjs
```

### 7. The code

Only now. `docs/architecture.md` if it's been generated — but **verify it against the actual
tree** rather than trusting it, since it is a snapshot of whenever `/formwork-map` last ran.

Then look at structure directly: top-level layout, entry points, and the area you're about to
touch. Read the tests near it — tests describe intended behaviour more honestly than comments.

## Report back

Six lines, not an essay:

1. **What this project is** — one sentence
2. **Tier**, and what that means for the work ahead
3. **State** — gates green or not, doctor warnings worth knowing
4. **Recent history** — what the last session did, and what it left undone
5. **Live constraints** — decisions or in-flight designs that bound what you can propose
6. **What you're unsure about** — genuinely. This is the most useful line, and the one most
   often skipped

## Do not

- **Do not read every file.** Priming is orientation, not an audit. If you're reading source
  files one by one, you've drifted into `/formwork-map`.
- **Do not trust a doc over the code.** Docs are claims; the code is the fact. Where they
  disagree, say so — that disagreement is a finding worth reporting.
- **Do not start work at the end of priming.** Report, then wait. The user may redirect based
  on what you found, and that redirect is the entire point of having primed.
