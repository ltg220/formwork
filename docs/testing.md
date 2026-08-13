# Testing

The single answer to "what does green mean here?"

## The one command

```bash
node scripts/gates.mjs
```

CI runs exactly this. So does everyone locally, before every commit. There is no second list
of commands that can drift out of sync — the gates are defined once, in `keel.config.json`.

```bash
node scripts/gates.mjs --list          # what would run, without running it
node scripts/gates.mjs --only test     # one gate
node scripts/gates.mjs --tier L3       # preview a stricter tier
```

## What runs at each tier

| Gate | L1 | L2 | L3 | What it proves |
|---|:--:|:--:|:--:|---|
| `typecheck` | yes | yes | yes | The code is internally consistent |
| `test` | yes | yes | yes | The behaviour is what we claimed |
| `lint` | — | yes | yes | The code matches house style |
| `build` | — | yes | yes | It actually compiles and bundles |
| `coverage-gates` | — | — | yes | Nobody bypassed a load-bearing rule |
| ratchet | — | yes | yes | No number got worse |

## Skipped is not passed

A gate with no command configured is **skipped**, and the runner says so. This is deliberate —
a brand-new repo must be green, or people learn to ignore the runner within a day.

But it means **green does not mean checked** until the gates are configured. `node
scripts/doctor.mjs` exists partly to nag about exactly this, and treats unconfigured gates as
a hard failure at L2 and above.

## The ratchet

```bash
node scripts/ratchet.mjs            # check
node scripts/ratchet.mjs --update   # lock in an improvement
```

Tracks numbers that should only go down — lint findings, `any` casts, TODOs, files over N
lines. It does not ask you to fix existing debt; it freezes the pile where it is and fails
when it grows.

**The baseline only ever moves down.** If the ratchet fails, fix the new findings. Raising the
baseline to make CI pass defeats the entire mechanism, and the failure message says so.

## Writing tests

Detail lives in `docs/rules.md`. The three that matter most:

1. **The test must exercise the changed path.** Trace its entry point to the real function. A
   green test that never reaches the code you changed is theatre.
2. **Assert the user-visible property**, at the level it's observable. "Contains X" is weak.
3. **Verify the test can fail.** Break the code on purpose and watch it go red. A test that
   passes against a broken implementation is pinning the bug, not the behaviour.

## Adding a gate

1. Add the command to `keel.config.json` → `gates.<name>`.
2. If it's a new gate name, add it to the tier's list in `scripts/lib/config.mjs`.
3. Run `node scripts/gates.mjs --list` to confirm it's picked up.
4. Update the table above.
