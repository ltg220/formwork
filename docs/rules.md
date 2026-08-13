# Coding standards

`CLAUDE.md` holds the load-bearing rules — the ones that must never be broken. This file holds
the working detail: how we review, how we commit, how we test, and the failure patterns worth
naming so we stop repeating them.

Edit this freely. It is meant to accumulate lessons.

---

## Review tiers

Pick the tier **before** starting non-trivial work, not after. The pull request template asks
for it. Tiers below are the minimum — nothing stops you doing more.

| Tier | What it covers | Minimum review |
|---|---|---|
| **Low** | Isolated, reversible, no data or auth touched | Self-review. Read your own diff before pushing |
| **Medium** | Shared code, user-visible behaviour, new dependency | One review round by a subagent with fresh eyes |
| **High** | Schema, migrations, auth, money, deletion, anything unattended | Two adversarial rounds + all gates green |
| **Very high** | Irreversible, or touches production data directly | Above, plus a smoke test, a written rollback, and explicit human sign-off |

**Adversarial means adversarial.** The reviewer's job is to find what's wrong, not to confirm
it looks fine. A review that returns "looks good" on the first pass has usually not been asked
a sharp enough question.

### Why two rounds, not one

Round 1 reviews the original code. Round 2 reviews **the fixes from round 1** — and that is
where a surprising share of real bugs live, because fix passes are written quickly and under
the assumption the hard thinking is already done. Round 3 hits diminishing returns; past that,
a smoke test is a better use of the same effort.

---

## Commits

- **One logical change per commit.** Bundling hides causation. When something breaks two weeks
  later, `git bisect` is only as useful as the commits are atomic.
- **Never bundle a risky new feature with a correctness fix.** If the fix has to be reverted,
  the feature goes with it, and vice versa.
- Message format: `<type>(<scope>): <what changed>` — e.g. `fix(auth): reject expired tokens`.
  Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- The body explains **why**, not what. The diff already says what.

---

## Testing

The full picture of what runs, and when, is in `docs/testing.md`. The philosophy:

- **Tests ship with the code.** New file, new test, same change. Not "later."
- **Don't backfill tests for existing working code.** Low value, high effort. The one
  exception is a coverage gate protecting a security or drift class.
- **A test must exercise the path it claims to.** Trace the test's entry point to the actual
  function being changed. A green test that never touches the changed code is worse than no
  test — it buys confidence you have not earned.
- **Assert the user-visible property**, at the level where it's observable. "Output contains
  X" is weak; a broken implementation often still contains X.
- **A green test can pin the bug.** If you write the test after the code, check that it fails
  when you break the code on purpose. If it doesn't, it isn't testing anything.

### Coverage gates

The strongest rule enforcement available. A coverage gate is a test that fails when someone
**bypasses** a rule, rather than when code is wrong. Examples:

- Every new route handler must call the auth helper — the gate walks every handler file and
  fails on one that doesn't.
- Every write to a particular table must go through one function — the gate greps for direct
  writes outside an allowlist.

Add one when a rule is load-bearing and easy to forget. An allowlist entry requires a written
justification, and that friction is the point.

---

## Failure patterns worth naming

These recur. Naming them makes them easier to catch.

**More guards of the same shape.** A probabilistic mitigation failed, so the instinct is to add
another one. If a guard didn't hold, the answer is structural enforcement, not a second guard
with the same weakness.

**Reader tolerance mistaken for data reality.** A parser that defensively accepts five formats
does not mean five formats exist. Count the data before scoping work around it.

**A clean merge is not a clean build.** Zero conflict markers says the texts merged, not that
the combined tree works. Validate the result, not the merge.

**Speculation inflating a small task.** Ship the smallest useful thing. Don't design for an
architecture that doesn't exist yet.

**Self-referential counts in prose.** "There are 5 shapes", "3 commits on this branch", a
specific record id — all rot silently, then mislead. Derive them, or leave them out.

**A verified workaround is architecture.** Once a workaround is proven and load-bearing,
promote it: document it as the intended design, or it will be "cleaned up" by someone who
doesn't know why it exists.

---

## Naming and structure

- Match the surrounding code. Consistency beats personal preference every time.
- Small, composable, replaceable units. If changing A requires understanding B's internals,
  the seam is wrong.
- Comments explain **why**, not what. A comment restating the code is noise that rots.
- No line counts, file counts, or dates in comments. They are wrong within a month.

---

## Secrets

- Referenced by **name** in code, never by value.
- Values live in a password manager **and** the runtime's secret store. Password manager
  first, then set the runtime — that order means a lost runtime secret is recoverable.
- `docs/secrets.md` lists the names and what each is for. It never contains a value.
- Never echo a secret to check whether it is set. Check length or a hash prefix instead — a
  presence check has leaked a live key into a transcript before.
