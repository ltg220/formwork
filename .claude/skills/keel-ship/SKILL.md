---
name: keel-ship
description: Finish a change — verify gates, update known issues and roadmap, write the session handoff, push the branch, and open a pull request using the report as its body. Run after keel-review. Stops at the pull request; never merges.
---

# keel-ship

Close the loop. Leave a trail someone can follow.

**This skill never merges.** It opens the pull request and stops. Merging is a human decision,
and that boundary is deliberate.

## 1. Verify, don't assume

```bash
node scripts/gates.mjs
node scripts/doctor.mjs
```

Both must be acceptable — gates green, doctor without failures. If either isn't, **stop and
say so.** Do not open a pull request on red and note it in the description; that just moves
the problem to someone with less context.

## 2. Check the trail is complete

- **`.claude/plans/<slug>.md`** — all tasks ticked, or the unticked ones explained
- **`.claude/reports/<slug>-report.md`** — exists, honest about deviations and what was skipped
- **`docs/known-issues.md`** — updated if this introduced, revealed, or resolved a problem
- **`docs/decisions/`** — a new record if a non-obvious choice was made along the way
- **`docs/roadmap.md`** — the phase moved on, if it did

At L1, known-issues and handoffs are optional. Everything else still applies.

## 3. Write the handoff

At **L2 and above**: `docs/handoffs/YYYY-MM-DD-<slug>.md`, using the template in
`docs/handoffs/README.md`.

The section that earns its keep is **"what did not work."** Anyone can read the code to see
what shipped. Nobody can read it to see what was tried first and abandoned — and that is
exactly the knowledge that stops the next person repeating it.

Keep it short. A handoff nobody reads is worse than none, because it looks like coverage.

## 4. Commit anything outstanding

Docs updates go in their own commit:

```
docs: handoff and known-issues for <feature>
```

Then check what you're about to publish:

```bash
git log <base>..HEAD --oneline
```

**Read this list.** If there are commits you don't recognise, they belong to another session
or another lane — stop and ask before pushing. Do not rebase past unfamiliar commits.

## 5. Push and open the pull request

```bash
git push -u origin <branch>
```

Open the PR with the repo template. Fill it from the report:

- **What changed** — one or two sentences
- **Why** — link the spec
- **Risk tier** — tick the box `/keel-plan` determined from the blast radius
- **Blast radius** — from the plan's Risks section
- **How to undo this** — concretely. If the honest answer is "we can't", say that; it should
  change how carefully this gets reviewed
- **Verification** — tick what's genuinely done. Do not tick a box you did not check
- **What I did not do** — from the report's Not-done and Follow-ups

Paste the report body underneath.

## 6. Report back

- The pull request URL
- Risk tier, and the review rounds actually run
- Gates status
- What was left undone, explicitly
- What needs a human decision before merge

## Do not

- **Do not merge.** Ever, in this skill. The loop stops at the pull request.
- **Do not push to the default branch.** Feature branch, pull request, always.
- **Do not force-push** a branch someone else may have.
- **Do not tick verification boxes you did not verify.** A false tick is worse than an
  unticked box, because it stops the reviewer looking.
- **Do not write a handoff that only lists successes.** The dead ends are the valuable part.
- **Do not open a pull request on red gates.** Fix it, or say clearly that you're stopping.
