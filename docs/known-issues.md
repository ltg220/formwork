# Known issues

Everything currently known to be broken, incomplete, or suspicious. This is the first file to
read before scoping any fix, and the first to update when you find something.

**Entries are hypotheses until verified.** An entry says what someone believed at the time they
wrote it. Before acting on one, check it against the actual current behaviour — a surprising
share turn out to be already fixed, or misdiagnosed.

## Format

Each entry gets its own `###` heading with a stable ID. The ID is what people reference in
commits and pull requests, so it must not change once assigned.

```
### ISSUE-001 — Short description
**Severity:** critical | high | medium | low
**Status:** open | investigating | fixed (unverified) | closed
**Found:** how it surfaced
**Impact:** who or what is affected, concretely
**Hypothesis:** the current best guess at the cause
**Next:** the smallest step that would confirm or kill the hypothesis
```

## Rules

- **Do not keep a summary count at the top of this file.** It goes stale immediately and then
  actively lies. The per-entry `Status:` line is the only source of truth.
- Closing an entry means deleting it and recording the fix in the handoff — not leaving a
  growing graveyard of `closed` entries. Move anything worth remembering to
  `docs/archive/`.
- If an issue is worth a design doc, write one in `docs/designs/` and link it from here.

---

## Open

<!-- No known issues yet. Add them as you find them. -->

_Nothing recorded. Either this project is very new, or nobody is writing things down._
