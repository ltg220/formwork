#!/usr/bin/env node
// formwork — doctor.
//
// Answers one question: has this repo drifted from its own rules?
//
// Not a linter and not a test runner — it checks the harness itself. The failure mode it
// exists to catch is the quiet one: a rulebook full of placeholders nobody filled in, a tier
// that demands gates nobody configured, a protected-files list pointing at files that were
// deleted. Each of those makes the whole structure decorative, and none of them announce
// themselves.
//
//   node scripts/doctor.mjs
//   node scripts/doctor.mjs --tier L3   check against a stricter tier without editing config
//
// Exit 0 = healthy (warnings allowed). Exit 1 = something is broken.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { loadConfig, REPO_ROOT, ConfigError, TIER_DEFAULTS } from "./lib/config.mjs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

const findings = [];
const ok = (msg) => findings.push({ level: "ok", msg });
const warn = (msg, fix) => findings.push({ level: "warn", msg, fix });
const fail = (msg, fix) => findings.push({ level: "fail", msg, fix });

const rel = (p) => join(REPO_ROOT, p);
const exists = (p) => existsSync(rel(p));
const read = (p) => readFileSync(rel(p), "utf8");

// CLAUDE.md sets its own limit at ~200 lines and gives the reason: a rulebook nobody finishes
// reading is a rulebook nobody follows. Enforcing it here is the whole thesis in miniature —
// the rule that checks itself is the rule that survives.
const RULEBOOK_MAX_LINES = 200;

function checkRulebook() {
  if (!exists("CLAUDE.md")) {
    fail("CLAUDE.md is missing", "Restore it from the formwork template.");
    return;
  }
  const body = read("CLAUDE.md");
  const lines = body.split("\n").length;

  const placeholders = [...body.matchAll(/<([A-Z][A-Z0-9_]{2,})>/g)].map((m) => m[1]);
  if (placeholders.length > 0) {
    const unique = [...new Set(placeholders)];
    warn(
      `CLAUDE.md still has ${unique.length} unfilled placeholder(s): ${unique.join(", ")}`,
      "Run /formwork-init, or fill them by hand.",
    );
  } else {
    ok("CLAUDE.md has no unfilled placeholders");
  }

  if (lines > RULEBOOK_MAX_LINES) {
    warn(
      `CLAUDE.md is ${lines} lines (soft limit ${RULEBOOK_MAX_LINES})`,
      "Something in it is probably state, not a rule. Move it to docs/known-issues.md, " +
        "docs/handoffs/, or docs/decisions/.",
    );
  } else {
    ok(`CLAUDE.md is ${lines} lines`);
  }
}

function checkDocs(cfg) {
  const required = [
    "docs/rules.md",
    "docs/known-issues.md",
    "docs/testing.md",
    "docs/roadmap.md",
    "docs/secrets.md",
  ];
  const missing = required.filter((p) => !exists(p));
  if (missing.length > 0) {
    fail(`Missing required docs: ${missing.join(", ")}`, "Restore from the formwork template.");
  } else {
    ok(`All ${required.length} required docs present`);
  }

  if (!exists("docs/decisions/0001-stack.md")) {
    warn(
      "No stack decision recorded (docs/decisions/0001-stack.md)",
      "Run /formwork-init. Without it, nobody knows why this stack was chosen and the agent " +
        "will happily propose changing it.",
    );
  } else {
    ok("Stack decision is recorded");
  }

  if (cfg.docs?.handoffs) {
    const dir = rel("docs/handoffs");
    const entries = existsSync(dir)
      ? readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md")
      : [];
    if (entries.length === 0) {
      warn(
        `Tier ${cfg.tier} expects handoffs, but docs/handoffs/ has none`,
        "Run /formwork-ship at the end of a session, or write one by hand.",
      );
    } else {
      ok(`${entries.length} handoff(s) on file`);
    }
  }
}

function checkGates(cfg) {
  const required = cfg.requiredGates ?? [];
  const unconfigured = required.filter((g) => !cfg.gates?.[g]);

  if (unconfigured.length === 0) {
    ok(`All ${required.length} gates configured for tier ${cfg.tier}`);
    return;
  }

  const msg =
    `Tier ${cfg.tier} requires ${required.length} gate(s); ` +
    `${unconfigured.length} unconfigured: ${unconfigured.join(", ")}`;
  const fix = "Set them in formwork.config.json → gates.<name>. Unconfigured gates are SKIPPED, " +
    "which means green does not mean checked.";

  // At L1 that is expected and fine. At L2+ it is the exact silent failure this tool exists
  // to surface: a repo that reports green while checking almost nothing.
  if (cfg.tier === "L1") warn(msg, fix);
  else fail(msg, fix);
}

function checkRatchet(cfg) {
  if (!cfg.ratchet?.enabled) {
    ok(`Ratchet off at tier ${cfg.tier} (expected)`);
    return;
  }
  const metrics = Object.keys(cfg.ratchet?.metrics ?? {});
  if (metrics.length === 0) {
    warn(
      `Ratchet is on at tier ${cfg.tier} but no metrics are configured`,
      "Add ratchet.metrics in formwork.config.json, or the ratchet is protecting nothing.",
    );
    return;
  }
  if (!exists(".formwork/baseline.json")) {
    warn(
      `Ratchet has ${metrics.length} metric(s) but no baseline recorded`,
      "Run: node scripts/ratchet.mjs --update — then commit .formwork/baseline.json.",
    );
    return;
  }
  ok(`Ratchet armed with ${metrics.length} metric(s) and a committed baseline`);
}

function checkProtected(cfg) {
  const list = cfg.loop?.protected ?? [];
  if (list.length === 0) {
    warn(
      "No protected files configured",
      "The loop could edit its own rules. At minimum protect CLAUDE.md and formwork.config.json.",
    );
    return;
  }
  const mustProtect = ["CLAUDE.md", "formwork.config.json"];
  const unguarded = mustProtect.filter((f) => !list.includes(f));
  if (unguarded.length > 0) {
    fail(
      `Protected list is missing: ${unguarded.join(", ")}`,
      "An agent that can edit its own rulebook has no rules. Add them to loop.protected.",
    );
    return;
  }
  // Globs are passed through untouched; only plain paths are checked for existence.
  const stale = list.filter((p) => !p.includes("*") && !exists(p));
  if (stale.length > 0) {
    warn(
      `Protected list references files that do not exist: ${stale.join(", ")}`,
      "Stale entries make the list look more protective than it is.",
    );
    return;
  }
  ok(`${list.length} protected path(s), rulebook and config both covered`);
}

// The guard is only real if the harness is told to run it. Deleting one line from
// settings.json removes every protection with no other symptom — no test fails, nothing looks
// different. That silence is exactly why this check is a hard failure.
function checkGuard(cfg) {
  if (!exists("scripts/guard.mjs")) {
    fail(
      "scripts/guard.mjs is missing — protected files are not enforced",
      "Restore it from the formwork template. Without it, loop.protected is only a suggestion.",
    );
    return;
  }

  if (!exists(".claude/settings.json")) {
    fail(
      "No .claude/settings.json — the protected-file guard is not wired up",
      'Add a PreToolUse hook running "node scripts/guard.mjs".',
    );
    return;
  }

  let settings;
  try {
    settings = JSON.parse(read(".claude/settings.json"));
  } catch (err) {
    fail(`.claude/settings.json is not valid JSON: ${err.message}`, "Fix it — the guard is not running.");
    return;
  }

  const entries = settings?.hooks?.PreToolUse ?? [];
  const wired = entries.filter((e) =>
    (e?.hooks ?? []).some((h) => String(h?.command ?? "").includes("guard.mjs")),
  );

  if (wired.length === 0) {
    fail(
      "The protected-file guard is not registered as a PreToolUse hook",
      'Add it to .claude/settings.json. Until then loop.protected is documentation, not enforcement.',
    );
    return;
  }

  // Guarding Edit and Write but not Bash leaves an open door: `echo x > CLAUDE.md`.
  const matchers = wired.map((e) => String(e.matcher ?? ""));
  const missing = ["Edit", "Write", "Bash"].filter((t) => !matchers.some((m) => m.includes(t)));
  if (missing.length > 0) {
    warn(
      `Guard hook does not cover: ${missing.join(", ")}`,
      "A guard that misses Bash is bypassed by a shell redirect. Widen the matcher.",
    );
    return;
  }

  ok(`Protected-file guard wired and covering ${cfg.loop?.protected?.length ?? 0} path(s)`);
}

function git(args) {
  const proc = spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
  if (proc.error || proc.status !== 0) return null;
  return (proc.stdout ?? "").trim();
}

// Moving state out of CLAUDE.md stops the RULEBOOK rotting; it does not stop the state
// rotting. Without this check, the memory layer degrades silently — and stale docs are worse
// than none, because people act on them.
function checkStaleness(cfg) {
  if (!cfg.docs?.knownIssues && !cfg.docs?.handoffs) return;
  if (!git(["rev-parse", "--git-dir"])) return; // not a git repo yet

  const total = Number(git(["rev-list", "--count", "HEAD"]) ?? 0);
  if (!total) return; // no history to measure against

  const limit = cfg.docs?.stalenessCommits ?? 15;

  for (const [enabled, path, label] of [
    [cfg.docs?.handoffs, "docs/handoffs", "handoffs"],
    [cfg.docs?.knownIssues, "docs/known-issues.md", "known-issues"],
  ]) {
    if (!enabled) continue;

    const last = git(["log", "-1", "--format=%H", "--", path]);
    const behind = last ? Number(git(["rev-list", "--count", `${last}..HEAD`]) ?? 0) : total;

    if (behind > limit) {
      warn(
        `${label} last updated ${behind} commits ago (limit ${limit})`,
        "The memory layer is drifting. Run /formwork-audit, or write the handoff you skipped. " +
          "Stale docs mislead more than missing ones.",
      );
    } else {
      ok(`${label} current (${behind} commit(s) behind)`);
    }
  }
}

function checkArchitecture(cfg) {
  if (!cfg.docs?.architectureDrift) return;
  if (!exists("docs/architecture.md")) {
    warn(
      `Tier ${cfg.tier} expects an architecture map, none found`,
      "Run /formwork-map to generate docs/architecture.md from the code.",
    );
    return;
  }
  ok("Architecture map present");
}

function main() {
  console.log(`${BOLD}formwork doctor${OFF}\n`);

  const tierArg = process.argv.indexOf("--tier");
  const tierOverride = tierArg === -1 ? null : process.argv[tierArg + 1] ?? null;

  let cfg;
  try {
    cfg = loadConfig({ tierOverride });
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`${RED}${err.message}${OFF}`);
      return 1;
    }
    throw err;
  }

  const known = TIER_DEFAULTS[cfg.tier];
  console.log(`${DIM}${cfg.name} · ${cfg.tier} — ${known.intent}${OFF}`);
  console.log(`${DIM}stack: ${cfg.stack ?? "not set"}${OFF}\n`);

  checkRulebook();
  checkDocs(cfg);
  checkGates(cfg);
  checkRatchet(cfg);
  checkProtected(cfg);
  checkGuard(cfg);
  checkStaleness(cfg);
  checkArchitecture(cfg);

  for (const f of findings) {
    if (f.level === "ok") console.log(`${GREEN}ok  ${OFF} ${f.msg}`);
    else if (f.level === "warn") console.log(`${YELLOW}warn${OFF} ${f.msg}`);
    else console.log(`${RED}FAIL${OFF} ${f.msg}`);
    if (f.fix) console.log(`     ${DIM}→ ${f.fix}${OFF}`);
  }

  const fails = findings.filter((f) => f.level === "fail").length;
  const warns = findings.filter((f) => f.level === "warn").length;
  const oks = findings.filter((f) => f.level === "ok").length;

  console.log(
    `\n${BOLD}Summary${OFF} ${GREEN}${oks} ok${OFF} · ` +
      `${YELLOW}${warns} warning${warns === 1 ? "" : "s"}${OFF} · ${RED}${fails} failure${fails === 1 ? "" : "s"}${OFF}`,
  );

  if (fails > 0) {
    console.log(`\n${RED}The harness is not sound. Fix the failures above.${OFF}`);
    return 1;
  }
  if (warns > 0) {
    console.log(`\n${GREEN}Healthy${OFF}${DIM}, with warnings worth reading.${OFF}`);
    return 0;
  }
  console.log(`\n${GREEN}Healthy.${OFF}`);
  return 0;
}

process.exit(main());
