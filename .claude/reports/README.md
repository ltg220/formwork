# Reports

What actually happened when a plan was implemented. Written by `/keel-implement`, used as the
pull request body by `/keel-ship`.

A plan says what was intended. A report says what occurred — and the gap between them is the
most useful information either document contains.

## Naming

`<feature-slug>-report.md` — matching the spec and the plan.

## Format

```markdown
# <Feature> — report

Plan: .claude/plans/<slug>.md

## Done
Each task, and what it actually took. Note where reality differed from the plan.

## Tests added
What they cover. Which are new, which were modified.

## Gates
Output of `node scripts/gates.mjs`. Paste the summary line.

## Deviations from the plan
Where the plan was wrong, and what was done instead. **The most valuable section.**

## Not done
Anything in the plan that was skipped, and why. If nothing was skipped, say so explicitly —
an empty section reads as an oversight.

## Follow-ups
Anything found along the way that is out of scope. These become entries in
`docs/known-issues.md` or `tasks/queue.md`, not silent debt.
```

## Rules

- **Written at the end of implementation, before the pull request.**
- **Honest about what did not work.** A report that only lists successes is a press release,
  and the next person pays for it.
- Short. If it's longer than the plan, something has gone wrong — probably the plan was too
  vague and the report is doing its job for it.

---

_No reports yet._
