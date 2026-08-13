# Work queue

The outer loop reads this file top-down and takes the first unchecked item.

Keep items **small and independently shippable** — one item should become one pull request. An
item that can't be described in two lines is an epic; run `/formwork-spec` on it and let the plan
break it up.

## Format

```
- [ ] <imperative title> — <one line of what "done" looks like>
```

Optional trailing tags:

- `(tier: L2)` — run this item at a higher tier than the project default
- `(blocked: <reason>)` — the loop skips it and says why

## Rules

- The loop **never** edits this file to add work for itself. Only you add items.
- The loop marks an item `[x]` only after its pull request is open.
- An item that fails twice is left unchecked and tagged `(blocked: …)`. The loop moves on
  rather than retrying forever.

---

## Queue

<!-- Add items below. Delete this comment once you have real ones. -->

- [ ] Example — replace this with real work; the loop takes the first unchecked item
