#!/usr/bin/env node
// keel — the gate runner.
//
// This is what CI runs, and what you run before every commit. It is the single answer to
// "is this repo green?", which is why `docs/testing.md` points here rather than listing
// commands that drift.
//
// It is stack-agnostic on purpose: it knows nothing about npm, cargo, go, or pytest. The tier
// decides WHICH gates are required; keel.config.json decides HOW to run each one. Swap the
// config and the same runner works on a different language.
//
//   node scripts/gates.mjs            run every required gate
//   node scripts/gates.mjs --list     show what would run, run nothing
//   node scripts/gates.mjs --only test
//   node scripts/gates.mjs --tier L3  preview a stricter tier without editing config

import { spawnSync } from "node:child_process";
import { loadConfig, resolveGates, REPO_ROOT, ConfigError } from "./lib/config.mjs";

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (f) => {
  const i = argv.indexOf(f);
  return i === -1 ? null : argv[i + 1] ?? null;
};

const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

function main() {
  let cfg;
  try {
    cfg = loadConfig({ tierOverride: valueOf("--tier") });
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`${RED}${err.message}${OFF}`);
      process.exit(2);
    }
    throw err;
  }

  let gates = resolveGates(cfg);
  const only = valueOf("--only");
  if (only) {
    gates = gates.filter((g) => g.name === only);
    if (gates.length === 0) {
      console.error(`${RED}No gate named ${JSON.stringify(only)} at tier ${cfg.tier}.${OFF}`);
      console.error(`Available: ${cfg.requiredGates.join(", ")}`);
      process.exit(2);
    }
  }

  console.log(`${BOLD}keel gates${OFF} ${DIM}· ${cfg.name} · ${cfg.tier} — ${cfg.tierIntent}${OFF}\n`);

  if (has("--list")) {
    for (const g of gates) {
      const state = g.command ? g.command : `${DIM}(not configured — will skip)${OFF}`;
      console.log(`  ${g.name.padEnd(16)} ${state}`);
    }
    console.log(`\n${DIM}Nothing was run (--list).${OFF}`);
    return 0;
  }

  const results = [];
  for (const gate of gates) {
    if (!gate.command) {
      // Not configured is not failure. A fresh repo must be green, or the runner gets ignored.
      console.log(`${YELLOW}SKIP${OFF} ${gate.name} ${DIM}— no command configured${OFF}`);
      results.push({ ...gate, status: "skipped" });
      continue;
    }

    console.log(`${BOLD}RUN ${OFF} ${gate.name} ${DIM}· ${gate.command}${OFF}`);
    const started = Date.now();
    const proc = spawnSync(gate.command, {
      cwd: REPO_ROOT,
      shell: true,
      stdio: "inherit",
    });
    const secs = ((Date.now() - started) / 1000).toFixed(1);

    if (proc.error) {
      console.log(`${RED}FAIL${OFF} ${gate.name} ${DIM}— could not start: ${proc.error.message}${OFF}\n`);
      results.push({ ...gate, status: "failed" });
      continue;
    }
    if (proc.status !== 0) {
      console.log(`${RED}FAIL${OFF} ${gate.name} ${DIM}— exit ${proc.status} · ${secs}s${OFF}\n`);
      results.push({ ...gate, status: "failed" });
      continue;
    }
    console.log(`${GREEN}PASS${OFF} ${gate.name} ${DIM}· ${secs}s${OFF}\n`);
    results.push({ ...gate, status: "passed" });
  }

  const failed = results.filter((r) => r.status === "failed");
  const skipped = results.filter((r) => r.status === "skipped");
  const passed = results.filter((r) => r.status === "passed");

  console.log(
    `${BOLD}Summary${OFF} ${GREEN}${passed.length} passed${OFF} · ` +
      `${RED}${failed.length} failed${OFF} · ${YELLOW}${skipped.length} skipped${OFF}`,
  );

  if (skipped.length > 0) {
    console.log(
      `${DIM}Skipped gates are unconfigured, not passing. Set them in keel.config.json ` +
        `→ gates.${skipped[0].name}${OFF}`,
    );
  }

  if (failed.length > 0) {
    console.log(`\n${RED}Not green. Do not commit.${OFF}`);
    return 1;
  }
  console.log(`\n${GREEN}Green.${OFF}`);
  return 0;
}

process.exit(main());
