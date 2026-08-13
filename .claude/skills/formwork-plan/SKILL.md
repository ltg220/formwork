---
name: formwork-plan
description: Turn a spec into a numbered task list on disk, where every task carries its own validation command. Writes .claude/plans/<slug>.md and creates the feature branch. Run after formwork-spec and before formwork-implement.
---

# formwork-plan

Turn intent into a numbered list of tasks that someone else could execute.

## Why the plan is a file

Because a plan held in conversation dies with the conversation. Context compacts, the session
ends, the machine changes — and the work restarts from nothing.

A plan committed to the branch means any session, on any machine, resumes at task 7 of 12.
That is the entire mechanism. It isn't clever; it just refuses to keep state somewhere that
evaporates.

## 1. Read first

- The spec — `docs/specs/<slug>.md`
- `CLAUDE.md` — the rules the plan must not violate
- The **actual code** you're about to change. Not from memory, not from `docs/architecture.md`.
  Read the files.

If there's no spec and the work is non-trivial, stop and run `/formwork-spec` first.

## 2. Understand the blast radius

Before writing a single task, answer:

- What depends on the code being changed?
- What breaks if this is wrong?
- Is any of it irreversible — data, schema, anything external?

This determines the **risk tier** for the pull request, and how hard `/formwork-review` will look.
Put the answer in the plan's Risks section. "Nothing depends on this" is a valid answer, but
it should be a conclusion, not an assumption.

## 3. Write tasks

Each task is one logical change, small enough to verify on its own.

```markdown
### 3. Add creature fainting to the battle loop
**File:** src/battle/loop.ts
**Action:** modify
**Detail:** When a creature's hp reaches 0, mark it fainted, remove it from the active slot,
and prompt for a replacement. If no healthy creature remains, end the battle as a loss.
**Check:** `npm test -- battle/loop`
```

**Every task needs a Check.** This is the rule that makes the inner loop work:

> A task is not done until its check passes.

An error caught at task 3 costs one task of rework. The same error found at task 11 means
unwinding eight tasks built on a bad foundation.

If a task genuinely cannot be checked by a command, that is a signal the task is too vague or
too large. Split it. **`Check: manual` is a last resort**, and it must say exactly what to
look at and what correct looks like.

### Ordering

- Dependencies first. A task should never need something a later task creates.
- **Tests belong in the same task as the code they cover**, not batched at the end. A
  test-writing task at position 12 is a task that gets skipped.
- Put the riskiest task early, while there is still appetite to change approach.

## 4. Size the plan

Somewhere between three and fifteen tasks.

- Fewer than three — you probably didn't need a plan. Just do it.
- More than fifteen — this is an epic. Split it into phases that each ship independently, and
  plan only the first.

## 5. Write the file and branch

```bash
git checkout -b feature/<slug>
```

Write `.claude/plans/<slug>.md` using the template in `.claude/plans/README.md`, then
**commit it before implementing**:

```
docs(plan): <feature>
```

A plan that exists only locally is a plan that dies with the machine.

## 6. Read it back

Show the user the task list — titles and checks, not the full detail. Ask whether the order is
right and whether anything is missing.

They will catch things you cannot, because they know what this project is for.

## Then

Tell them the plan is committed and `/formwork-implement` is next. **Do not start implementing.**

## Do not

- **Do not write a task without a Check.** This is the one non-negotiable rule in this skill.
- **Do not plan from memory of the code.** Read the actual files. Planning against a
  remembered version produces tasks that reference things that moved.
- **Do not bundle unrelated changes** into one plan because they're nearby. One plan, one
  logical change, one pull request.
- **Do not plan past fifteen tasks.** Long plans are wrong by the middle, and the second half
  gets rewritten anyway.
