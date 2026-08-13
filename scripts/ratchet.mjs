#!/usr/bin/env node
// keel — the quality ratchet.
//
// A ratchet turns "we should keep the codebase clean" from a wish into a rule CI enforces.
// It tracks numbers that should only ever go DOWN — lint findings, `any` casts, TODOs,
// files over N lines, whatever you decide matters — and fails when one grows.
//
// It deliberately does NOT demand you fix existing debt. That is what makes it adoptable on a
// codebase that already has some: the pile is frozen where it is, and cannot grow.
//
//   node scripts/ratchet.mjs           check every metric against its baseline
//   node scripts/ratchet.mjs --update  record current values as the new baseline
//
// Configure in keel.config.json:
//
//   "ratchet": {
//     "metrics": {
//       "lint": {
//         "command": "npx eslint . -f unix | grep -c ''",
//         "description": "total eslint findings",
//         "tolerance": 25
//       }
//     }
//   }
//
// The command's stdout must end with a number. Anything else is a configuration error, and
// is reported as one rather than silently treated as zero.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { loadConfig, REPO_ROOT, ConfigError } from "./lib/config.mjs";

const BASELINE_PATH = join(REPO_ROOT, ".keel", "baseline.json");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

const update = process.argv.includes("--update");

function readBaseline() {
  if (!existsSync(BASELINE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  } catch (err) {
    console.error(`${RED}.keel/baseline.json is not valid JSON: ${err.message}${OFF}`);
    process.exit(2);
  }
}

function writeBaseline(data) {
  mkdirSync(dirname(BASELINE_PATH), { recursive: true });
  writeFileSync(BASELINE_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

// Take the LAST number in stdout. Most counting commands (`grep -c`, `wc -l`, a summary line)
// end with the figure, and being strict about the whole output being numeric would rule out
// every tool that prints a header.
function measure(name, command) {
  const proc = spawnSync(command, { cwd: REPO_ROOT, shell: true, encoding: "utf8" });
  if (proc.error) {
    return { error: `could not start: ${proc.error.message}` };
  }
  const out = (proc.stdout ?? "").trim();
  const matches = out.match(/-?\d+/g);
  if (!matches) {
    return {
      error:
        `command produced no number.\n` +
        `        command: ${command}\n` +
        `        stdout:  ${out.slice(0, 200) || "(empty)"}`,
    };
  }
  return { value: Number(matches[matches.length - 1]) };
}

function main() {
  let cfg;
  try {
    cfg = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`${RED}${err.message}${OFF}`);
      return 2;
    }
    throw err;
  }

  const metrics = cfg.ratchet?.metrics ?? {};
  const names = Object.keys(metrics);

  console.log(`${BOLD}keel ratchet${OFF} ${DIM}· ${cfg.name} · ${cfg.tier}${OFF}\n`);

  if (!cfg.ratchet?.enabled && !update) {
    console.log(
      `${DIM}Ratchet is off at tier ${cfg.tier}. Nothing checked.\n` +
        `Raise the tier, or set ratchet.enabled true in keel.config.json.${OFF}`,
    );
    return 0;
  }

  if (names.length === 0) {
    console.log(
      `${DIM}No metrics configured. Add them under ratchet.metrics in keel.config.json.\n` +
        `A ratchet with no metrics is not protecting anything.${OFF}`,
    );
    return 0;
  }

  const baseline = readBaseline();
  const next = { ...baseline };
  let failures = 0;
  let improvements = 0;

  for (const name of names) {
    const metric = metrics[name];
    const command = typeof metric === "string" ? metric : metric?.command;
    if (!command) {
      console.log(`${RED}ERR ${OFF} ${name} ${DIM}— no command configured${OFF}`);
      failures++;
      continue;
    }

    const tolerance = (typeof metric === "object" ? metric.tolerance : null) ?? cfg.ratchet?.tolerance ?? 0;
    const label = (typeof metric === "object" ? metric.description : null) ?? name;

    const { value, error } = measure(name, command);
    if (error) {
      console.log(`${RED}ERR ${OFF} ${name} ${DIM}— ${error}${OFF}`);
      failures++;
      continue;
    }

    if (update) {
      next[name] = value;
      const was = baseline[name];
      const delta = was === undefined ? "new" : `was ${was}`;
      console.log(`${GREEN}SET ${OFF} ${name.padEnd(16)} ${value} ${DIM}(${delta}) — ${label}${OFF}`);
      continue;
    }

    if (baseline[name] === undefined) {
      next[name] = value;
      console.log(
        `${YELLOW}BASE${OFF} ${name.padEnd(16)} ${value} ${DIM}— first run, baseline recorded${OFF}`,
      );
      continue;
    }

    const ceiling = baseline[name] + tolerance;
    if (value > ceiling) {
      console.log(
        `${RED}FAIL${OFF} ${name.padEnd(16)} ${value} ${DIM}> ${ceiling} ` +
          `(baseline ${baseline[name]}${tolerance ? ` +${tolerance} tolerance` : ""}) — ${label}${OFF}`,
      );
      failures++;
      continue;
    }

    if (value < baseline[name]) improvements++;
    console.log(
      `${GREEN}OK  ${OFF} ${name.padEnd(16)} ${value} ${DIM}<= ${ceiling} — ${label}${OFF}`,
    );
  }

  if (update || Object.keys(next).length !== Object.keys(baseline).length) {
    writeBaseline(next);
  }

  console.log("");

  if (update) {
    console.log(`${GREEN}Baseline written to .keel/baseline.json. Commit it.${OFF}`);
    return 0;
  }

  if (failures > 0) {
    console.log(
      `${RED}Ratchet failed (${failures}).${OFF}\n` +
        `${DIM}A number got worse. Fix the new findings — do not raise the baseline to make\n` +
        `this pass. The baseline only ever moves down.${OFF}`,
    );
    return 1;
  }

  if (improvements > 0) {
    console.log(
      `${GREEN}Ratchet passed.${OFF} ${DIM}${improvements} metric(s) improved — run\n` +
        `  node scripts/ratchet.mjs --update\n` +
        `to lock the lower number in, so it can never drift back up.${OFF}`,
    );
    return 0;
  }

  console.log(`${GREEN}Ratchet passed.${OFF}`);
  return 0;
}

process.exit(main());
