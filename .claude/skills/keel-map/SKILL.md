---
name: keel-map
description: Generate docs/architecture.md from the actual code — module map, data flow for the main paths, seams, and non-obvious load-bearing details. Run after structural changes, or whenever the architecture doc is stale. Never hand-edit the output.
---

# keel-map

Write down how the system is actually built, by reading it.

## Why generated, not written

A hand-maintained architecture doc rots, because updating it is a separate act of discipline
from changing the code, and the discipline always loses. Then people navigate by a map that no
longer matches the ground.

Generating it means the doc is **never premature** — you don't have to invent an architecture
on day one — and **never stale**, because regenerating is cheap. The cost is that it describes
what is there, not what was intended. That is usually the more useful document anyway.

## When to run

- After a structural change: a new module, a moved boundary, a deleted subsystem
- Before onboarding anyone (including a future session)
- As part of `/keel-audit`
- At L3, before any release

## 1. Read the code

Actually read it. Not the old architecture doc, not your memory of it.

- Top-level layout, and what each directory is for
- Entry points — what starts, on what trigger
- The two or three most important data paths, end to end
- Where the boundaries are, and whether they hold
- Tests, for the areas where intent isn't obvious from the code

For anything large, work module by module rather than trying to hold it all at once.

## 2. Find what isn't obvious

This is the part that makes the document worth having. Look for:

- **Load-bearing details a reader would miss.** A guard clause that prevents a whole failure
  class. An order of operations that matters. A workaround that is actually the design.
- **Seams.** Where the system is deliberately replaceable, and where it only looks like it is.
- **Asymmetries.** Two things that look parallel but aren't — the most common source of a
  confident wrong change.
- **Comments saying "do not change this."** Find out why, and record the reason. A warning
  without a reason gets ignored by the next person in a hurry.

## 3. Write the file

Overwrite `docs/architecture.md`. Keep the "generated file — do not hand-edit" header.

Structure:

```markdown
## What this is
One paragraph. What the system does, from outside.

## Module map
| Module | Responsibility | Depends on |

## Data flow
The two or three main paths, end to end. A diagram only where it is genuinely clearer than a
sentence — a diagram restating a list is decoration.

## Seams
Where this is designed to be replaced, and what a replacement would have to honour.

## Load-bearing details
The things a reader would otherwise miss, each with WHY it matters.

## Not obvious from the code
Anything true about the system that reading it would not reveal.
```

Describe **what is**, not what should be. If something is ugly, say it is ugly and why it is
that way. An architecture doc that quietly describes the intended design instead of the real
one is how people make confident wrong changes.

## 4. Drift check (L3)

At L3, compare against the previous version before overwriting:

```bash
git diff docs/architecture.md
```

Structural change that nobody wrote down is a finding. Report it — a new dependency between
modules that were meant to be independent is exactly the kind of thing that never gets
announced and is expensive to discover later.

## 5. Commit

`docs(architecture): regenerate map`

## Report back

- What changed since the last map, if anything
- Anything surprising you found while reading
- Any drift worth a decision doc or a known-issues entry

## Do not

- **Do not hand-edit `docs/architecture.md`.** Fix the code, or fix this skill. An edited
  generated file loses the one guarantee it has.
- **Do not describe intent as reality.** If the boundary is leaky, say the boundary is leaky.
- **Do not include line counts, file counts, or dates.** They are wrong within a month and
  then actively mislead.
- **Do not diagram what a sentence covers.** Diagrams cost more to maintain than they look.
