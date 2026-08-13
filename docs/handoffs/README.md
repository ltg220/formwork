# Handoffs

A dated log of what actually happened, newest first. Read the most recent one before starting
work.

The problem this solves: an agent has no memory between sessions, and neither, honestly, does
a person after a fortnight. Without a handoff, every session begins by reconstructing context
from the code — which is slow, and reconstructs only what's *there*, never what was tried and
abandoned.

## Naming

```
YYYY-MM-DD-short-slug.md
```

Date first so the directory sorts chronologically. Multiple handoffs in one day are fine —
add a suffix.

## Rules

- **Write it at the end of the work, not the start of the next session.** `/keel-ship` does
  this automatically.
- **Say what did NOT work.** The dead ends are the expensive knowledge. Anyone can read the
  code to see what shipped; nobody can read it to see what was tried first.
- **Say what you left undone, and why.** Silence here reads as "everything is handled."
- Keep them short. A handoff nobody reads is worse than none, because it looks like coverage.
- Old handoffs are not maintained. They are a record of what was believed at the time, not a
  source of truth about now. `CLAUDE.md` and `docs/known-issues.md` are the current state.

## Template

```markdown
# YYYY-MM-DD — <what this session was about>

## What shipped
Concrete. Link the pull requests.

## What did not work
Approaches tried and abandoned, and why. The most valuable section.

## What's left undone
Deliberately skipped, or blocked. Say which.

## Gotchas found
Anything surprising. If it will bite again, it belongs in a runbook or CLAUDE.md instead —
link it from here.

## Next
The single most useful thing to do next, and why it's that one.
```

---

_No handoffs yet._
