---
name: keel-review
description: Adversarially review the current diff before it becomes a pull request, at the round count the tier demands. Spawns an independent reviewer whose job is to find what is wrong, verifies each finding before reporting it, and reviews the fix pass too. Run after keel-implement.
---

# keel-review

Attack the diff before anyone else has to.

## Rounds by tier

Read `keel.config.json` for `tier` and `review.rounds`.

| Tier | Rounds | Reviewer |
|---|---|---|
| **L1** | 0 | Skip. Say you're skipping and why |
| **L2** | 1 | Independent subagent |
| **L3** | 2 | Independent subagent, second round over the fixes |

The pull request's own **risk tier** can raise this. A High-risk change in an L1 project still
gets two rounds — the project tier is a floor, not a ceiling. Ask if it's unclear.

## Why two rounds

Round 1 reviews the original code. Round 2 reviews **the fixes from round 1** — and a
surprising share of real bugs live there, because fix passes are written fast, under the
assumption the hard thinking is done.

Round 3 hits diminishing returns. Past that, a smoke test is a better use of the same effort.

## 1. Assemble context

```bash
git diff <base>...HEAD
```

Gather: the diff, the spec, the plan, the report, and `CLAUDE.md`. A reviewer without the
spec cannot tell "wrong" from "not what was asked."

## 2. Spawn an independent reviewer

Use a subagent. **Independence is the point** — an agent reviewing its own work in the same
context is checking its own reasoning with the same assumptions that produced the error.

Brief it explicitly:

> Your job is to find what is **wrong** with this change. Not to confirm it looks fine.
> Assume there is at least one real defect and find it.
>
> Prioritise, in this order:
> 1. **Correctness** — does it do what the spec says, including the edge cases in it?
> 2. **Blast radius** — what else touches this? What breaks that isn't in the diff?
> 3. **Rule violations** — check the change against CLAUDE.md, specifically.
> 4. **Test quality** — does each test exercise the changed path? Would it fail if the code
>    were broken? A test that passes against a broken implementation is worse than none.
> 5. **Reversibility** — can this be undone? If not, is that acknowledged?
>
> For each finding, give: the file and line, what is wrong, and a **concrete failure
> scenario** — specific inputs or state leading to a specific wrong outcome. A finding
> without a failure scenario is a preference, and preferences are not findings.

## 3. Verify before reporting

**Check each finding yourself before showing it to the user.** Reviewers produce
confident-sounding findings that are wrong, and passing those through unchecked costs more
trust than the review earns.

For each: read the actual code and decide whether the failure scenario really holds.

- Holds → report it
- Doesn't → drop it, and don't mention it
- Can't tell → report it as uncertain, and say what would settle it

## 4. Fix, then review the fixes

Fix what's real. Then, at L3, **run round 2 over the fix diff specifically.**

Point the second reviewer at the fixes:

> These changes were made in response to review findings. Review them with the same
> hostility. Fix passes are written quickly and often introduce their own defects.

## 5. Record what you didn't fix

Findings that are real but out of scope go to `docs/known-issues.md` with a severity — not
into silence. Note them in the report's Follow-ups section too.

**Do not fix out-of-scope findings now.** That is how a reviewable pull request becomes an
unreviewable one.

## 6. Re-run gates

```bash
node scripts/gates.mjs
```

Fixes can break things. The review is not done until the gates are green again.

## Report back

- Rounds run, and why that number
- Findings, most severe first, each with its failure scenario
- What was fixed, what was recorded, what was dropped as not real
- Gates status

If nothing real was found, **say that plainly.** Do not pad a thin result to look thorough —
"one round, no real findings, here's what I checked" is a perfectly good outcome and an honest
one.

## Do not

- **Do not review your own work in the same context.** Spawn the subagent.
- **Do not pass findings through unverified.** You are accountable for what you report.
- **Do not accept "looks good" from a first-round reviewer.** Re-brief with a sharper question.
- **Do not treat style preferences as findings.** If it doesn't have a failure scenario, it
  isn't one.
- **Do not skip round 2 at L3** because round 1 was clean. Round 2 exists to review the
  fixes, and a clean round 1 means there is less to review, not that the round is unnecessary.
