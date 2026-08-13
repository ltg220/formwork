# Plans

**This directory is the reason long tasks survive.**

A plan is a numbered task list on disk, committed to the feature branch. Not in the chat, not
in an agent's context window — in a file. Session dies, context compacts, you move to another
machine: the work resumes at task 7 of 12 instead of starting over.

That is the whole mechanism. It isn't clever; it's just refusing to keep state somewhere that
evaporates.

## The rule that makes plans work

**Every task carries its own validation command, and a task is not done until its check
passes.**

Errors caught at task 3 cost one task of rework. The same error found at task 11 means
unwinding eight tasks built on a bad foundation.

## Naming

`<feature-slug>.md` — matching the spec and the report.

## Format

```markdown
# <Feature> — plan

Spec: docs/specs/<slug>.md
Branch: feature/<slug>

## Tasks

### 1. <What to do>
**File:** path/to/file
**Action:** create | modify | delete
**Detail:** enough that someone with no context could do it
**Check:** `<the exact command that proves this task is done>`

### 2. …

## Not doing
Explicitly out of scope for this plan.

## Risks
What could go wrong. What to watch for while implementing.
```

## Rules

- **Commit the plan before implementing.** It is part of the change, and a plan that exists
  only locally is a plan that dies with the machine.
- **Progress is tracked in the file**, by checking tasks off — not in conversation.
- If the plan turns out wrong mid-implementation, **stop and update the plan**, then continue.
  Do not silently diverge; the divergence is exactly what the report needs to record.

---

_No plans yet. `/formwork-plan` writes them._
