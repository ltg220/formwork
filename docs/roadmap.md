# Roadmap

What's next, in order. Enough to answer "what should I work on" without re-deciding every
session.

This is not a backlog — the backlog is `tasks/queue.md`. This is the shape of the next few
phases and why they're in that order.

## Rules

- **Phases, not dates.** Dates rot; order doesn't. If something must happen by a date, that
  belongs in the phase description as a constraint.
- **Each phase is independently shippable and independently testable.** If a phase can't be
  verified on its own, it's two phases wearing a coat.
- Finished phases move to `docs/archive/`. This file stays short.

---

## Now

<!-- The one phase in flight. If there is more than one, that is the problem to fix first. -->

**Phase 0 — Initialise.** Run `/keel-init` to choose a stack, record why, and wire the gates.

*Done when:* `node scripts/gates.mjs` runs real commands and is green, and
`docs/decisions/0001-stack.md` exists.

## Next

<!-- Two or three phases, ordered. Enough to see where this is going, not so much that it's fiction. -->

_Nothing planned yet._

## Later

<!-- Things worth remembering, deliberately not scheduled. -->

_Nothing recorded._

## Explicitly not doing

<!-- The most valuable section here. Records what was considered and rejected, so it doesn't
     get re-proposed every few weeks. Link the decision doc where one exists. -->

_Nothing recorded._
