# Designs

Design docs for in-flight work — features big enough that starting to code without a written
plan would be guessing.

A design doc is not a decision doc. A **decision** records a choice already made and is
immutable. A **design** is a working document for something being built, and it changes as
understanding improves. When a design settles a real architectural question, that question
graduates into `docs/decisions/`.

## When to write one

Write a design doc if any of these are true:

- The change touches more than one system
- There is more than one plausible approach and the choice isn't obvious
- It affects data you cannot easily undo
- You will not remember why you did it this way in three months
- Someone else will have to work on it

Skip it if the change is small and self-evident. A design doc for a two-line fix is ceremony.

## Rules

- **Record rejected alternatives.** Same reason as decisions — it stops the same idea coming
  back. This is the single most valuable section.
- Link the design from `docs/known-issues.md` if it's fixing something tracked there.
- When the work ships, move the doc to `docs/archive/` and note the outcome at the top —
  including what turned out to be wrong.

## Template

```markdown
# <Feature> — design

**Status:** draft | in review | building | shipped
**Owner:**

## Problem
What is actually broken or missing. Written from the user's side, not the code's.

## Constraints
What we cannot change. Existing schema, a deadline, a dependency, a rule we won't break.

## Approach
How it works. Diagrams where a picture is genuinely clearer than a paragraph.

## Rejected alternatives
What else was considered and why it lost. Be specific.

## Risks
What could go wrong, and what we'd notice first.

## Rollback
How to undo this if it ships badly. If the answer is "we can't", say so here — that fact
should change how carefully it gets reviewed.

## Open questions
What we still don't know. Honest gaps beat confident guesses.
```
