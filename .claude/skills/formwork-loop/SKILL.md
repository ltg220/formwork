---
name: formwork-loop
description: Run the outer loop unattended — take the top item from tasks/queue.md, run spec through review, open a pull request, and stop. Never merges, never edits its own rules, never adds its own work. Use with /loop for a scheduled cadence.
---

# formwork-loop

Unattended work. One queue item at a time. **It stops at the pull request.**

## The boundary

**This skill never merges and never deploys.** That is not caution — it is where the industry
line sits: autonomous agents close every pre-merge stage, and merge stays human.

You wake up to pull requests to review, not to merged code you have never seen.

## Safety properties — all four, always

These are not configurable down. If any is missing, stop and say so.

**1. It cannot edit its own rules.** Everything in `formwork.config.json` → `loop.protected` is
off limits — including `CLAUDE.md` and the config itself. An agent that can rewrite its own
constraints has none. **Check the list before every write.** If a queue item requires touching
a protected file, stop and hand it to the user.

**2. It cannot give itself work.** The loop never adds items to `tasks/queue.md`. Findings go
to `docs/known-issues.md` and stay there until a human promotes them. A loop that fills its
own queue does not terminate.

**3. Bounded iterations.** `loop.maxIterations` caps items per run. When it's hit, stop and
report — do not decide the work is important enough to continue.

**4. Stop on repeat failure.** An item that fails twice is left unchecked, tagged
`(blocked: <reason>)`, and the loop moves to the next. Never a third attempt: two failures of
the same shape mean the understanding is wrong, and a third try produces something that passes
for the wrong reason.

## Autonomy levels

`formwork.config.json` → `loop.autonomy`. Raised by the user, **never by this skill.**

| Level | Allowed |
|---|---|
| **0** | Plan only. Write the spec and plan, change no code |
| **1** | Implement and commit on a branch. Do not push |
| **2** | Push and open a pull request |
| **3** | Also respond to review comments on its own PRs |
| **4-5** | Reserved. Not implemented — merge stays human |

If `autonomy` is 0 and a queue item needs code, produce the plan and stop. That is success,
not failure.

## The cycle

Per iteration:

**1. Check you can proceed.**
```bash
node scripts/gates.mjs
```
Red at the start means stop immediately. Working on a red repo means you cannot tell which
failures are yours, and every check afterwards is ambiguous.

**2. Take the top unchecked item** from `tasks/queue.md`. Skip anything tagged `(blocked:)`.
Empty queue → stop and say so. That is a good outcome.

**3. Run the inner loop**, honouring the item's tier tag if it has one:

```
/formwork-spec    (skip if the item is small and unambiguous — say you skipped it)
/formwork-plan
/formwork-implement
/formwork-review
/formwork-ship    (only at autonomy 2+)
```

**4. Mark the item `[x]`** — only once its pull request is open. At autonomy 0 or 1, leave it
unchecked and note where it stopped.

**5. Record what you learned.** Anything found and not fixed goes to `docs/known-issues.md`.
Never silently dropped.

**6. Next item**, until the queue empties or `maxIterations` is reached.

## Scheduling

This skill runs one pass. For a cadence, wrap it:

```
/loop 30m /formwork-loop
```

Pick an interval matched to how long an item actually takes. Waking every five minutes to
find work still in progress burns tokens for nothing.

**The stop button is stopping the loop.** No state to unwind, because nothing was merged.

## Report back

After every run, whether or not anything shipped:

- Items attempted, and what happened to each
- Pull requests opened, with URLs
- Items blocked, and why
- Anything added to known-issues
- **What needs a human** before any of it can merge

Be blunt about failures. A loop that reports optimistically is worse than one that doesn't
run, because it earns trust it hasn't got.

## Do not

- **Do not merge.** Not "if the gates are green", not "if it's trivial." Never.
- **Do not deploy**, or run anything that reaches production.
- **Do not touch protected files**, or change `loop.autonomy`.
- **Do not add items to the queue.**
- **Do not retry a failing item a third time.**
- **Do not continue past `maxIterations`** because the next item looks quick.
- **Do not skip review** because the change is small. The tier decides rounds, not you — and
  unattended work is exactly where an unreviewed change is most expensive.
