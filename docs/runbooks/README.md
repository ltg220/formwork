# Runbooks

It broke. What do I do.

One file per failure mode you have actually hit. Written for the version of you that is tired,
stressed, and has no context — because that is who reads a runbook.

## When to write one

**The moment after you recover from something.** Not later. The knowledge of what you tried,
what didn't work, and what finally fixed it has a half-life of about a day.

If you found yourself thinking "I'll remember this", that is the signal to write it down.

## Rules

- **Commands, not prose.** A runbook the reader has to interpret is a runbook that fails at
  3am. Give the literal command.
- **Lead with how to confirm it's this problem.** Half of incident time is misdiagnosis.
- **Say what NOT to do.** The tempting wrong move is worth more than the right one, because
  someone will reach for it.
- Keep it current. A runbook referencing a deleted script is worse than none — it wastes the
  scarcest thing you have during an incident, which is attention.

## Template

```markdown
# <Symptom as you would actually observe it>

## Is it this?
The specific check that confirms or rules this out. A command and its expected output.

## Impact
Who is affected and how badly. Whether this is degrading or stable.

## Fix
Numbered steps. Literal commands. What each one should print.

## Do not
The tempting wrong move, and what it costs.

## Root cause
Why this happens. Link the design or decision doc if there is one.

## Prevention
What would stop it recurring. If it exists, link it. If it doesn't, that is a queue item —
add it to tasks/queue.md and link that.
```

---

_No runbooks yet. The first one usually gets written right after the first bad night._
