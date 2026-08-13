// Tests for the config loader.
//
// This file is small on purpose, and it covers exactly one thing: the tier resolution logic,
// which is the load-bearing piece of the whole harness. If tier defaults resolve wrongly, a
// repo silently runs fewer gates than its tier promises — and reports green while doing it.
// That is the worst failure this system can have, because it looks identical to health.
//
//   node --test scripts/

import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, resolveGates, TIERS, TIER_DEFAULTS, ConfigError } from "./config.mjs";

test("every declared tier has defaults", () => {
  for (const tier of TIERS) {
    assert.ok(TIER_DEFAULTS[tier], `${tier} has no defaults`);
    assert.ok(TIER_DEFAULTS[tier].intent, `${tier} has no intent string`);
    assert.ok(Array.isArray(TIER_DEFAULTS[tier].gates), `${tier} has no gate list`);
  }
});

test("tiers are strictly cumulative in what they require", () => {
  // A higher tier must require everything a lower one does. If L2 ever dropped a gate that L1
  // requires, raising the tier would quietly reduce coverage — the opposite of the promise.
  const [l1, l2, l3] = TIERS.map((t) => TIER_DEFAULTS[t].gates);
  for (const gate of l1) assert.ok(l2.includes(gate), `L2 dropped L1's ${gate}`);
  for (const gate of l2) assert.ok(l3.includes(gate), `L3 dropped L2's ${gate}`);
  assert.ok(l3.length > l1.length, "L3 must require more than L1");
});

test("review rounds increase with tier and never decrease", () => {
  const rounds = TIERS.map((t) => TIER_DEFAULTS[t].review.rounds);
  for (let i = 1; i < rounds.length; i++) {
    assert.ok(rounds[i] >= rounds[i - 1], `tier ${TIERS[i]} reviews less than ${TIERS[i - 1]}`);
  }
  assert.equal(rounds[0], 0, "L1 must not demand review — mess is allowed at L1");
});

test("the loop never merges at any tier", () => {
  // The single most important invariant in formwork. If a tier ever shipped stopAt other than
  // "pr", unattended work could reach the default branch without a human reading it.
  for (const tier of TIERS) {
    assert.equal(TIER_DEFAULTS[tier].loop.stopAt, "pr", `${tier} does not stop at the PR`);
  }
});

test("loop iterations are bounded at every tier", () => {
  for (const tier of TIERS) {
    const max = TIER_DEFAULTS[tier].loop.maxIterations;
    assert.ok(Number.isInteger(max) && max > 0 && max <= 20, `${tier} has an unsafe cap: ${max}`);
  }
});

test("loadConfig resolves the repo's own config", () => {
  const cfg = loadConfig();
  assert.ok(TIERS.includes(cfg.tier));
  assert.ok(Array.isArray(cfg.requiredGates));
  assert.ok(cfg.tierIntent, "tier intent should be surfaced for the runner to print");
});

test("tier override changes which gates are required", () => {
  const l1 = loadConfig({ tierOverride: "L1" });
  const l3 = loadConfig({ tierOverride: "L3" });
  assert.ok(l3.requiredGates.length > l1.requiredGates.length);
  assert.ok(l3.requiredGates.includes("coverage-gates"));
  assert.ok(!l1.requiredGates.includes("coverage-gates"));
});

test("an unknown tier is rejected, not silently defaulted", () => {
  // Falling back to a default here would be the dangerous kind of forgiving: a typo in the
  // tier would silently drop the project to weaker gates.
  assert.throws(() => loadConfig({ tierOverride: "L9" }), ConfigError);
  assert.throws(() => loadConfig({ tierOverride: "l1" }), ConfigError);
});

test("resolveGates pairs every required gate with its command or null", () => {
  const cfg = loadConfig({ tierOverride: "L3" });
  const gates = resolveGates(cfg);
  assert.equal(gates.length, cfg.requiredGates.length);
  for (const gate of gates) {
    assert.ok(typeof gate.name === "string");
    assert.ok(gate.command === null || typeof gate.command === "string");
  }
});

test("the protected list guards the rulebook and the config", () => {
  // An agent that can edit CLAUDE.md or formwork.config.json has no constraints at all. This is a
  // coverage gate in the strict sense: it fails when someone removes the guard, not when code
  // is merely wrong.
  const cfg = loadConfig();
  const guarded = cfg.loop?.protected ?? [];
  assert.ok(guarded.includes("CLAUDE.md"), "CLAUDE.md must be protected");
  assert.ok(guarded.includes("formwork.config.json"), "formwork.config.json must be protected");
});
