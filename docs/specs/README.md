# Specs

One file per feature: what we're building and how we'll know it works. Written **before** the
plan, which is written before the code.

A spec describes behaviour, not implementation. If it mentions a function name or a database
column, it has drifted into being a plan — move that part to `.claude/plans/`.

## Why bother

The failure mode this prevents is subtle: an agent given a vague instruction produces
something plausible, and plausible is very hard to argue with. A spec makes the target
checkable *before* anyone has invested effort in hitting the wrong one.

## Naming

`<feature-slug>.md` — the same slug used by the plan and the report, so the three are
greppable as a set.

## Written by

`/keel-spec` — it interviews you, then writes the file. Edit it afterwards; it's yours.

## Template

```markdown
# <Feature>

## Problem
What the user cannot do today. From their side, not the code's.

## Users
Who this is for, and what they are trying to accomplish.

## Behaviour
What the system does, as observable statements. Each one testable.

- When <situation>, the system <does this>.
- When <edge case>, the system <does this instead>.

## Out of scope
What this deliberately does not do. Prevents scope creep during implementation, and prevents
"but it doesn't handle X" in review when X was never the point.

## Done when
The checkable conditions. If you cannot describe how to verify one of these, it is not a
requirement yet — it is a wish.

## Open questions
What is genuinely undecided. Better here than resolved silently by whoever writes the code.
```

---

_No specs yet._
