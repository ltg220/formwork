---
name: keel-init
description: Initialise a fresh keel repo. Interviews the user about what they are building, recommends and records a stack, picks the tier, fills in CLAUDE.md, wires the real test runner and CI, and leaves the repo green. Run this once, first, in a new project created from the keel template.
---

# keel-init

The front door. Turns a generic template into *this* project.

Run once, at the start. Ten minutes of questions, then `node scripts/gates.mjs` runs real
commands and passes on an empty repo.

## Before starting

Read `keel.config.json`. If `name` is not `"unnamed-project"`, this repo is already
initialised — **stop and ask** whether to re-run. Re-initialising overwrites the rulebook and
the stack decision, and that is rarely what someone wants.

## 1. Interview

Ask these. Ask them **one or two at a time**, not as a wall — this is a conversation, and the
later questions depend on the earlier answers.

1. **What are you building?** One or two sentences.
2. **Who uses it?** Just you, a handful of people, or paying customers?
3. **How long will it live?** A weekend, a few months, years?
4. **Does it touch money, personal data, or authentication?**
5. **Will anything run unattended** — cron jobs, background workers, an agent loop?
6. **Do you already have a stack in mind**, or preferences to respect?
7. **Anything it must integrate with?**

Do not skip question 6. Overriding a preference the user already holds, without discussing it,
is the fastest way to lose their trust in everything else this skill did.

## 2. Recommend a stack

Propose one, with the two strongest alternatives and why they lost. Be concrete about
tradeoffs — "more complex" is not a reason; "needs a second service you'd have to operate" is.

Weight the recommendation toward:

- **What the user already knows.** A stack they can debug beats a better one they can't.
- **Boring and well-represented.** Both for library support and because an agent writes
  materially better code in ecosystems with more training data. This is a real effect and
  worth saying out loud.
- **An escape hatch.** Prefer things you can leave. Standard Postgres over a proprietary
  datastore; owned components over a rented design system.

**Get explicit approval before writing anything.** If the user pushes back, take it — they
know constraints you don't, and this decision is theirs.

## 3. Pick the tier — do not ask

Decide it from the interview and **tell them what you picked and why.** Asking invites
over-answering: people set everything to L3 out of conscience and then find the project
exhausting.

| Signals | Tier |
|---|---|
| Personal, prototype, learning, throwaway, a game, users = you | **L1** |
| Real users, lives more than a few months, someone else might touch it | **L2** |
| Money, personal data, auth, compliance, or anything running unattended | **L3** |

When it's genuinely borderline, choose the **lower** tier. Raising it later is one line;
abandoning a project that felt like paperwork is permanent.

Say the tier out loud with its meaning — especially that **L1 means mess is allowed.** People
need permission to move fast, or they won't.

## 4. Write the decision record

**First, clear keel's own decisions.** The template ships decision docs about *keel itself*
(each marked as such in a note under its title). They are inherited by every repo created from
the template, where they are noise — a game project does not care why keel's scripts are
JavaScript. Delete any decision doc carrying that marker. Keep `0000-template.md`.

Then create `docs/decisions/0001-stack.md` from `docs/decisions/0000-template.md`.

Fill in every section. **The two that matter most:**

- **Options considered** — including the rejected ones and specifically why they lost
- **What would change our mind** — the concrete trigger for revisiting

Without those, in three months nobody knows why, and the stack gets re-litigated from scratch.

## 5. Fill in CLAUDE.md

Replace the placeholders:

- `<PROJECT_NAME>` — the project name
- `<PROJECT_DESCRIPTION>` — two or three sentences from the interview
- `<STACK_TABLE>` — a table of layer / technology / why
- `<TIER>` — the chosen tier

**Do not add project-specific rules yet.** Rules earn their place by being broken first. A
rulebook front-loaded with speculative rules is one nobody reads.

## 6. Wire the gates

Update `keel.config.json`:

- `name`, `stack`, `tier`
- `gates.*` — the real commands for this stack

Then **scaffold the minimum for those commands to actually run.** A gate pointing at a script
that doesn't exist is worse than no gate, because it fails loudly for the wrong reason and
gets disabled.

For a Node/TypeScript project that means a `package.json` with real scripts, a tsconfig, and a
test runner installed with **one passing placeholder test**. Whatever the stack, the standard
is the same: gates run real commands, and they pass.

**Keep the harness's own tests running.** The template ships with
`gates.test` pointing at `node --test "scripts/**/*.test.mjs"`, which covers keel's tier logic
— including the invariant that the loop never merges. Do not replace that command; **chain**
it:

```
"test": "node --test \"scripts/**/*.test.mjs\" && <the project's own test command>"
```

Overwriting it silently disarms the checks protecting the harness itself.

At **L2 and L3**, also configure `ratchet.metrics` with at least one metric — usually a lint
count — and run `node scripts/ratchet.mjs --update` to record the baseline.

## 7. Verify

Run all three. Do not skip this and do not report success without it:

```bash
node scripts/doctor.mjs
node scripts/gates.mjs
node scripts/ratchet.mjs
```

Doctor may warn; it must not fail. Gates must be green with **real commands running**, not
skipping. If a gate skips, it isn't wired — go back to step 6.

## 8. Seed the paper trail

- `docs/roadmap.md` — replace Phase 0 with the first real phase
- `docs/handoffs/<today>-init.md` — what was decided and why, using the handoff template
- `tasks/queue.md` — remove the example, add the first two or three real items

## 9. Commit

One commit: `chore(keel): initialise <name> at <tier>`.

## Report back

Tell the user, briefly:

- The stack, and the single strongest reason for it
- The tier, what it means, and **what it does not enforce**
- Which gates are live and what each proves
- The one thing to do next

Then stop. Do not begin building — that is `/keel-spec`.

## Do not

- **Do not pick a stack the user has never used** without saying so plainly and getting
  agreement. Being right about a tool nobody can debug is being wrong.
- **Do not set L3 by default.** It is the most tempting mistake here and it kills projects.
- **Do not write rules into CLAUDE.md that nobody asked for.** Rules earn their place.
- **Do not leave gates unconfigured** and report success. Skipped is not passed.
