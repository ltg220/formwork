<!--
Keep this short. The detail belongs in .claude/reports/<slug>-report.md, which /keel-ship
writes and which you can paste below. This template exists to force three questions that are
easy to skip and expensive to skip: what could this break, how do I undo it, and who checked.
-->

## What changed

<!-- One or two sentences. What a reviewer needs before reading a single line of diff. -->

## Why

<!-- The problem, not the solution. Link the spec, issue, or decision doc. -->

## Risk tier

<!-- Pick one. It sets the minimum review this change needs. -->

- [ ] **Low** — isolated, reversible, no data or auth touched. Self-review is enough.
- [ ] **Medium** — touches shared code or user-visible behaviour. One review round.
- [ ] **High** — schema, migrations, auth, money, or anything that runs unattended. Two adversarial rounds + gates green.
- [ ] **Very high** — irreversible, or reaches production data directly. Above, plus a smoke test and a written rollback.

## Blast radius

<!-- What else touches this? What breaks if it's wrong? "Nothing" is a valid answer, but say it deliberately. -->

## How to undo this

<!-- Revert the commit? Run a down-migration? Flip a flag? If the answer is "we can't", that is a High-risk change regardless of size. -->

## Verification

- [ ] `node scripts/gates.mjs` is green
- [ ] Tests exist for the new behaviour, and they exercise the changed path
- [ ] I observed it working — not inferred it
- [ ] `docs/known-issues.md` updated if this introduced or resolved a known problem
- [ ] A decision doc exists if a non-obvious choice was made

## What I did not do

<!-- Deliberately out of scope, or found and left alone. Silence here reads as "everything is handled", which is rarely true. -->
