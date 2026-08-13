---
name: formwork-spec
description: Turn a feature idea into a written spec before any code is planned. Interviews the user about the problem, users, observable behaviour, and what done looks like, then writes docs/specs/<slug>.md. Run before formwork-plan on anything non-trivial.
---

# formwork-spec

Write down what we're building, and how we'll know it works — **before** anyone decides how.

## Why this exists

Given a vague instruction, an agent produces something plausible. Plausible is very hard to
argue with after the fact, because the work looks finished and the disagreement sounds like
nitpicking. A spec makes the target checkable *before* effort is spent hitting the wrong one.

## When to skip it

A one-line fix. An obvious change. Something you could describe completely in a sentence.

Ceremony on a small change teaches people to route around the process, which costs more than
the spec saved. **Say you're skipping it and why**, then go straight to `/formwork-plan`.

## 1. Understand the problem

Ask, a couple at a time:

1. **What can't the user do today?** Their side, not the code's.
2. **Who is this for?** What are they actually trying to accomplish?
3. **What does the ideal outcome look like** from their point of view?
4. **What's explicitly out of scope?**
5. **Anything this must not break?**

If the answer to (1) is phrased as a solution ("we need a settings page"), ask what problem the
settings page solves. Half of over-built features come from specifying the solution someone
arrived at rather than the problem they arrived from.

## 2. Check it isn't already decided

Before writing: grep `docs/decisions/` and `docs/designs/`.

If this was considered and rejected, say so and stop. New evidence is welcome — but new
evidence means a **new decision doc**, not an argument.

## 3. Write behaviour as observable statements

Each one must be testable:

```
- When a trainer has no healthy creatures, the system ends the battle and returns them to the
  last visited town.
- When a trainer flees mid-battle, the system keeps any experience already earned.
```

Not: "battles should work well" or "handle edge cases gracefully."

**Rule of thumb: if you cannot describe how to verify a statement, it is not a requirement
yet — it is a wish.** Say so and either sharpen it or move it to open questions.

## 4. Write the file

`docs/specs/<slug>.md`, using the template in `docs/specs/README.md`.

The slug is used by the plan and the report too, so pick something short and greppable.

Fill in every section. **Two are load-bearing:**

- **Out of scope** — prevents drift during implementation, and prevents "but it doesn't
  handle X" in review when X was never the point
- **Done when** — the checkable conditions. This is what `/formwork-plan` turns into tasks

## 5. Read it back

Show the user the behaviour statements and the "done when" list. Ask directly whether anything
is missing or wrong.

This is the cheapest possible moment to be wrong. Every later moment costs more.

## 6. Commit

`docs(spec): <feature>`. On the feature branch if one exists, otherwise the default branch —
the plan step will create the branch.

## Then

Tell the user the spec is ready and the next step is `/formwork-plan`. **Do not start planning.**
They may want to edit it first, and a spec they edited is a spec they own.

## Do not

- **Do not write implementation detail.** No function names, no columns, no file paths. If
  it's creeping in, it belongs in the plan.
- **Do not invent requirements the user didn't state.** Ask. Guessing generously is how a
  two-day feature becomes a two-week one.
- **Do not skip "out of scope."** An empty section reads as "everything is in scope."
- **Do not proceed with an unanswered open question that changes the shape of the work.**
  Small ambiguities can be assumed and flagged; structural ones must be resolved first.
