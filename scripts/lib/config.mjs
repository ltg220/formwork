// keel — config loader.
//
// One job: turn keel.config.json + the declared tier into a fully-resolved settings object.
//
// The tier is the training wheel. It supplies defaults for everything, so a new project only
// has to answer "what am I building" rather than fill in twenty knobs. Anything explicitly
// set in keel.config.json wins over the tier default — that is the only override mechanism,
// and it is deliberate: one place to look when behaviour surprises you.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, "..", "..");
const CONFIG_PATH = join(REPO_ROOT, "keel.config.json");

export const TIERS = ["L1", "L2", "L3"];

// What each tier means, in one place.
//
// `gates` lists which gates are REQUIRED to run at that tier. A gate that is required but has
// no command configured is SKIPPED with a notice, not failed — otherwise a fresh repo is red
// before you have written a line, which teaches everyone to ignore the runner.
export const TIER_DEFAULTS = {
  L1: {
    intent: "Prototype. Mess is allowed.",
    gates: ["typecheck", "test"],
    ratchet: { enabled: false, tolerance: 0 },
    review: { rounds: 0, subagent: false, reviewer: "general-purpose" },
    docs: { knownIssues: false, handoffs: false, architectureDrift: false },
    loop: { autonomy: 0, maxIterations: 3, stopAt: "pr" },
  },
  L2: {
    intent: "Product. Mess is flagged.",
    gates: ["typecheck", "lint", "test", "build"],
    ratchet: { enabled: true, tolerance: 0 },
    review: { rounds: 1, subagent: true, reviewer: "general-purpose" },
    docs: { knownIssues: true, handoffs: true, architectureDrift: false },
    loop: { autonomy: 1, maxIterations: 5, stopAt: "pr" },
  },
  L3: {
    intent: "Production. Mess is blocked.",
    gates: ["typecheck", "lint", "test", "build", "coverage-gates"],
    ratchet: { enabled: true, tolerance: 0 },
    review: { rounds: 2, subagent: true, reviewer: "general-purpose" },
    docs: { knownIssues: true, handoffs: true, architectureDrift: true },
    loop: { autonomy: 2, maxIterations: 5, stopAt: "pr" },
  },
};

const BASE = {
  name: "unnamed-project",
  tier: "L1",
  stack: null,
  gates: {
    install: null,
    typecheck: null,
    lint: null,
    test: null,
    build: null,
    "coverage-gates": null,
  },
  ratchet: { metrics: {} },
  review: {},
  loop: { queue: "tasks/queue.md", protected: [] },
};

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

// Shallow-by-key deep merge. Arrays replace wholesale — a partially-merged array of protected
// file globs would be a genuinely dangerous surprise.
function merge(base, override) {
  const out = { ...base };
  for (const [k, v] of Object.entries(override ?? {})) {
    if (v === undefined) continue;
    out[k] = isPlainObject(v) && isPlainObject(base?.[k]) ? merge(base[k], v) : v;
  }
  return out;
}

export class ConfigError extends Error {}

export function loadConfig({ tierOverride = null } = {}) {
  if (!existsSync(CONFIG_PATH)) {
    throw new ConfigError(
      "keel.config.json not found at the repo root.\n" +
        "This repo has not been initialised. Run /keel-init.",
    );
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch (err) {
    throw new ConfigError(`keel.config.json is not valid JSON: ${err.message}`);
  }

  const tier = tierOverride ?? raw.tier ?? "L1";
  if (!TIERS.includes(tier)) {
    throw new ConfigError(
      `Unknown tier ${JSON.stringify(tier)}. Expected one of: ${TIERS.join(", ")}`,
    );
  }

  const defaults = TIER_DEFAULTS[tier];
  const cfg = merge(merge(BASE, { ...defaults, gates: BASE.gates }), { ...raw, tier });

  // `gates` is two different things wearing one name: the tier says WHICH gates are required,
  // keel.config.json says HOW to run each. Keep them separate downstream.
  cfg.requiredGates = raw.requiredGates ?? defaults.gates;
  cfg.tierIntent = defaults.intent;

  return cfg;
}

export function resolveGates(cfg) {
  return cfg.requiredGates.map((name) => ({
    name,
    command: cfg.gates?.[name] ?? null,
  }));
}
