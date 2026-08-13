# <PROJECT_NAME> — Agent Rulebook

> **This file holds durable rules only.** Architecture, conventions, and the load-bearing
> constraints that must survive every session.
>
> **Current state does NOT belong here — it rots.** For what's broken, read
> `docs/known-issues.md`. For what happened, the newest file in `docs/handoffs/`. For what's
> next, `docs/roadmap.md`. For why we chose something, `docs/decisions/`.
>
> **Keep this file short.** If it passes ~200 lines, something in it is state, not a rule.
> Move it out. A rulebook nobody finishes reading is a rulebook nobody follows.

<!-- keel-init fills the three blocks below. Everything after them is universal. -->

## What this is

<PROJECT_DESCRIPTION>

## Stack

<STACK_TABLE>

Why this stack, what we rejected, and what would make us change our mind:
`docs/decisions/0001-stack.md`. **Read it before proposing a change to the stack.**

## Tier

**<TIER>** — see `keel.config.json`. Tier decides which gates run and how hard review is.

- **L1** — prototype. Mess is allowed. Ship fast, tests exist, nothing else blocks.
- **L2** — product. Mess is flagged: lint, ratchet, known-issues, one review round.
- **L3** — production. Mess is blocked: coverage gates, two adversarial rounds, drift checks.

Do not quietly raise or lower the tier. It's a deliberate decision, recorded in a decision doc.

---

# Load-bearing rules

These are universal. They came from real failures, and they hold at every tier.

## 1. A rule that isn't enforced is a wish

Rules live in three places, weakest to strongest:

1. **This file** — prose. Useful, and ignorable.
2. **Ratchets** — `scripts/ratchet.mjs`. CI fails if a number gets worse.
3. **Coverage gates** — a test that fails when someone bypasses a rule.

When a rule in this file gets broken twice, that is a signal to promote it to a ratchet or a
gate. **Do not respond to a broken rule by restating it more firmly.** Another guard of the
same shape fails the same way.

## 2. A task is not done until its check passes

Every task in a plan carries its own validation command. Run it before moving to the next
task. Catching an error at task 3 is cheap; discovering it at task 11 means unwinding eight
tasks of work built on a bad foundation.

## 3. Understand before changing

Before modifying any file: know what it does, what depends on it, and the blast radius. If
the blast radius is unclear, that is the thing to find out first — not something to discover
by breaking it.

## 4. Verify before writing

Confirm a thing exists before referencing it — a column, a function, a flag, a file, an ID.
Silent failures from an assumed name cost hours. A thirty-second check never does.

Assertions about the world need the same treatment. If asked "are you sure?", stop and
verify; do not restate the claim with more confidence.

## 5. One logical change per commit

Bundling hides causation and prevents isolating a problem during rollback. Especially: keep
risky new features out of correctness-fix commits.

## 6. Existing patterns first

Before writing something new, check whether the pattern already exists here. Match the
surrounding code's naming, structure, and comment density. Code that reads like its
neighbours is code the next person can change safely.

## 7. Small, composable, replaceable units

Every unit should be independently testable and replaceable. No tight coupling between
systems. If a change to A requires understanding B's internals, the seam is in the wrong
place.

## 8. Choose dependencies deliberately — in both directions

Two questions, every time:

1. **Does it hide something you need to see when it breaks?**
2. **Can you leave it?**

A framework that owns your core loop makes that loop undebuggable — that is the disqualifying
kind. A framework that does work you would otherwise do worse is the opposite: refusing it is
the unjustified choice. Nobody should write their own renderer, ORM, or test runner to stay
pure.

"Direct calls over abstraction" is a good default for the code that **is** your product. It is
a bad default for everything around it.

Neither "it seemed standard" nor "frameworks are bad" is a reason. The posture for this
project — where a framework is welcome and where it is not — is decided at init and recorded
in `docs/decisions/0001-stack.md`. Read it before arguing either way.

## 9. No regressions

Every change is validated against existing behaviour. Fixing one thing while breaking
another is not a fix.

## 10. Tests ship with the code

Every new file gets its test in the **same** change, not "later." Do not backfill tests for
existing working code — the exception is a coverage gate guarding a security or drift class.

## 11. Green before commit

Run `node scripts/gates.mjs` before every commit. Don't commit red. A pre-existing unrelated
failure is tracked debt — don't let it block you, and don't add to it.

## 12. A test must exercise the code path it claims to

Trace the test's entry point to the real function being changed. A green test that never
touches the changed path is theatre, and worse than no test because it buys false confidence.

Assert the user-visible property, at the level where it's observable. "Output contains X" is
a weak assertion that a broken implementation often still satisfies.

## 13. Say what actually happened

If tests fail, say so and show the output. If a step was skipped, say which. If something is
done and verified, say it plainly. Never report completion for work that is partial.

When an audit or sweep finds little, say that. Padding a thin result to look thorough is a
lie with extra steps.

## 14. Stop and ask when it matters

If two readings of a request lead to materially different work, ask. If one reading is
obviously right, proceed and say which one you took. Silent assumptions are the expensive
failure; asking about a settled question is the cheap annoyance.

## 15. Never lose the plot

Before proposing anything, check whether it's already decided: grep `docs/decisions/` and
`docs/designs/`. Design docs record **rejected alternatives** for exactly this reason. Do not
re-litigate a closed decision without new evidence — and if there is new evidence, that's a
new decision doc, not an argument.

---

# Where things live

| Question | File |
|---|---|
| What's broken right now? | `docs/known-issues.md` |
| What happened recently? | `docs/handoffs/` (newest first) |
| What's next? | `docs/roadmap.md` |
| Why is it built this way? | `docs/decisions/` |
| How does an in-flight feature work? | `docs/designs/` |
| It broke — what do I do? | `docs/runbooks/` |
| What does "green" mean? | `docs/testing.md` |
| How is the code laid out? | `docs/architecture.md` (generated by `/keel-map` — do not hand-edit) |
| What secrets exist? | `docs/secrets.md` (names only — **never** values) |

---

# Working agreements

- **Full file replacements over partial diffs** when rewriting a file wholesale.
- **Phase-by-phase execution.** Break large features into independently testable phases.
  Verify each before starting the next. No compounding untested changes.
- **Read the actual file before editing it.** Never work from memory of a previous version.
- **Don't hardcode counts, dates, or IDs into prose** ("5 shapes", "3 commits", a specific
  record id). They rot silently and then mislead. Derive them, or don't state them.
- **Secrets are referenced by name, never by value** — not in code, not in docs, not in chat.
  The value lives in a password manager and the runtime's secret store. Vault first, then set.
- **No emoji in user-facing output** unless explicitly requested.

---

# Definition of done

A change is done when all of these are true:

1. The behaviour works, and you've observed it working — not inferred it.
2. Its test exists and exercises the actual changed path.
3. `node scripts/gates.mjs` is green.
4. Anything newly known-broken is in `docs/known-issues.md`.
5. Any non-obvious decision is in `docs/decisions/`.
6. The report in `.claude/reports/` says what was done, what was skipped, and why.

At L2 and L3, add: reviewed at the tier's round count, with findings either fixed or recorded.
