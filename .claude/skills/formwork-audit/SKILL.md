---
name: formwork-audit
description: Check whether the repo has drifted from its own documentation — stale known issues, rules nobody follows, decisions overtaken by events, gates that check nothing. Reports findings and proposes the smallest fix for each. Run periodically, or when the docs stop feeling trustworthy.
---

# formwork-audit

Do the documents still describe reality?

## Why

Documentation rots silently, and rotten documentation is worse than none — it is confidently
wrong, and people act on it. The specific failure: a rule everyone believes is enforced but
isn't, a known-issue that was fixed months ago, a decision whose premise no longer holds.

Each of those makes the whole structure decorative, and none announce themselves.

## When to run

- Every few weeks on an active project
- After a burst of fast work
- When a doc surprises you by being wrong — that is never the only one
- Before handing the project to someone else

## 1. Machine checks first

```bash
node scripts/doctor.mjs
node scripts/gates.mjs --list
```

Doctor covers structural drift: unfilled placeholders, an over-long rulebook, unconfigured
gates, a missing ratchet baseline, protected-file entries pointing at deleted files.

`--list` answers the question doctor can't: **which gates are actually running versus
skipping.** A repo reporting green while skipping four gates is the most dangerous state in
this whole system, because it looks exactly like health.

## 2. Known issues — are they still true?

For each entry in `docs/known-issues.md`:

- **Verify it against the current code.** Entries are hypotheses, and a fair share are stale
  or were misdiagnosed to begin with.
- Fixed → delete the entry, note it in the handoff. Do not accumulate a graveyard of `closed`
  entries; that is how a catalog becomes unreadable.
- Still real but the hypothesis is wrong → correct it. A wrong hypothesis sends the next
  person down the same dead end.

## 3. Rules — is anyone following them?

For each rule in `CLAUDE.md`, ask: **could I tell if this were being broken?**

- **Enforced by a gate or ratchet** → healthy.
- **Prose only, and being followed** → fine for now.
- **Prose only, and being broken** → this is the finding that matters most.

A rule broken twice should be **promoted, not restated**. Restating it more firmly is the
classic wrong response: another guard of the same shape fails the same way. Propose the
concrete promotion — a lint rule, a ratchet metric, a coverage gate.

Also look for rules nobody needs any more. A rulebook that only grows becomes one nobody
finishes reading, and an unread rule is not a rule.

## 4. Decisions — do the premises hold?

Read each decision's **"what would change our mind"** section and check whether the trigger
has fired. Scale crossed, a cost changed, a dependency abandoned, a constraint gone.

If one has: that is not an argument, it is a **new decision doc** superseding the old.

## 5. Architecture — has it drifted?

Regenerate and compare:

```
/formwork-map
```

Structural change that nobody wrote down is a finding. Not necessarily a problem — but it
means the map people are navigating by is out of date.

## 6. Roadmap and queue

- Is "Now" actually what's being worked on?
- Are queue items still relevant, or has the world moved?
- Anything in "Explicitly not doing" that has quietly started happening?

## Report back

Findings grouped by severity, each with **the smallest fix**:

- **Broken** — a rule not enforced, a gate checking nothing, a doc that is actively wrong
- **Stale** — accurate once, misleading now
- **Missing** — something happened that nobody recorded

Then a single recommendation: **the one fix with the best ratio of effort to risk removed.**
A list of twenty findings gets skimmed and abandoned; one clear next action gets done.

If the repo is in good shape, **say so and stop.** Do not manufacture findings to look
thorough — a short honest audit is worth more than a padded one, and padding trains people to
ignore the next audit.

## Do not

- **Do not fix things silently during the audit.** Report first. The user decides what's worth
  changing; some drift is deliberate.
- **Do not treat every difference as drift.** Docs are simplifications on purpose.
- **Do not propose rewriting the docs.** Propose the smallest change that makes them true.
- **Do not skip the "is anyone following this rule" question.** It is the least mechanical
  check here and the one that finds the most.
