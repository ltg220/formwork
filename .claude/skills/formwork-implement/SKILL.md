---
name: formwork-implement
description: Execute a plan file task by task, running each task's validation command before moving to the next, then write a report of what actually happened. Run after formwork-plan. Resumable — picks up from the first unchecked task if a previous session stopped partway.
---

# formwork-implement

Execute the plan. One task at a time. Each one verified before the next begins.

## 1. Load the plan

Read `.claude/plans/<slug>.md` — the whole thing, before starting. You need to know where this
is going, not just the next step.

Also read `CLAUDE.md`. The rules apply to every line you're about to write.

**If tasks are already checked off, this is a resume.** Start at the first unchecked task. Do
not redo completed work, and do not assume it was done correctly — run the completed task's
check once to confirm the ground you're standing on is solid.

## 2. Confirm the starting state

```bash
node scripts/gates.mjs
```

If it's already red, **stop and say so.** Starting work on a red repo means you cannot tell
which failures are yours, and every subsequent check is ambiguous.

## 3. The inner loop

For each task, in order:

**a. Read the target.** Open the file. Read what's around it. Match the surrounding patterns —
naming, structure, comment density. Code that reads like its neighbours is code that can be
safely changed later.

**b. Implement exactly what the task says.** Not more. If you notice something else worth
fixing, write it down for the report — do not fix it. Scope creep inside a task is how a
reviewable change becomes an unreviewable one.

**c. Run the task's Check.**

**d. If the check passes**, tick the task in the plan file and move on. Update the file as you
go, not at the end — that file is what makes this resumable.

**e. If the check fails**, fix it before moving on. Do not proceed with a failing check and
plan to come back. That is precisely the failure mode this loop exists to prevent.

**f. If it fails twice for the same reason**, stop. Do not try a third variation. Two failures
of the same shape means the task, the plan, or your understanding is wrong — and a third
attempt built on the same misunderstanding produces something that passes for the wrong
reason. Say what you tried and ask.

## 4. When the plan is wrong

It will happen. The plan was written before the code was read closely.

**Stop, update the plan file, then continue.** Do not silently diverge — the divergence is
exactly what the report needs to record, and a plan that no longer matches what was built is
worse than no plan.

If the divergence is structural — the approach doesn't work — stop and say so. Do not
improvise a new architecture mid-implementation.

## 5. Full gates

After the last task:

```bash
node scripts/gates.mjs
```

Everything must be green. A task-level check passing does not mean the whole system is intact
— that is what the full run is for.

## 6. Write the report

`.claude/reports/<slug>-report.md`, using the template in `.claude/reports/README.md`.

The sections that matter:

- **Deviations from the plan** — where the plan was wrong and what was done instead
- **Not done** — anything skipped, and why. If nothing was skipped, **say so explicitly**;
  an empty section reads as an oversight
- **Follow-ups** — things noticed but deliberately not fixed. These become entries in
  `docs/known-issues.md` or `tasks/queue.md`, not silent debt

Paste the gates summary line. Do not paraphrase it.

## 7. Commit

One commit per logical change — usually one per task, or one per tightly related group. Not
one giant commit at the end: that hides causation and makes `git bisect` useless later.

## Report back

- Tasks completed, out of how many
- Gates: green or not, with the actual summary line
- Anything that deviated from the plan
- Anything you noticed and did not fix

Then stop. `/formwork-review` is next.

## Do not

- **Do not skip a check** because the change "obviously works." Obvious changes are where the
  worst bugs hide, precisely because nobody looks.
- **Do not fix unrelated things you notice.** Record them. A pull request that fixes three
  unrelated things cannot be reviewed properly or reverted cleanly.
- **Do not report completion with failing gates.** Say what's failing and why.
- **Do not mark a task done because you believe it works.** The check passing is the
  definition of done. Belief isn't.
