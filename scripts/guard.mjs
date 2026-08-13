#!/usr/bin/env node
// formwork — the protected-file guard.
//
// A PreToolUse hook. Claude Code runs it before every Edit, Write, or Bash call and blocks the
// call if it would modify a protected file.
//
// This exists because "the agent cannot edit its own rules" was, until this file, a sentence
// in a README. By formwork's own thesis that made it a wish — and it was the wish carrying the
// entire safety story for unattended operation. This turns it into a mechanism.
//
// Wired in .claude/settings.json. If that wiring is removed, the protection is gone: run
// `node scripts/doctor.mjs`, which checks the hook is actually registered.
//
// Fails CLOSED on the floor set: if the config is missing or corrupt, the crown jewels are
// still protected, because a guard that unprotects itself when confused is not a guard.

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

// Always protected, regardless of configuration — including this file and the hook wiring.
//
// Without a floor, the list of protected files lives only in formwork.config.json, and anything
// able to edit that file can unprotect everything else. The floor makes the guard's own
// integrity independent of the config it reads.
const FLOOR = [
  "CLAUDE.md",
  "formwork.config.json",
  ".claude/settings.json",
  "scripts/guard.mjs",
];

// Shell tokens that indicate a write. Used only for the Bash heuristic below.
const WRITE_INDICATORS = [
  />>?/, // redirection
  /\btee\b/,
  /\bsed\b[^|]*-i/,
  /\bmv\b/,
  /\bcp\b/,
  /\brm\b/,
  /\btruncate\b/,
  /\bdd\b/,
  /\bgit\s+checkout\b/,
  /\bgit\s+restore\b/,
  /\bapplypatch\b|\bgit\s+apply\b/,
];

function readConfigProtected() {
  const path = resolve(REPO_ROOT, "formwork.config.json");
  if (!existsSync(path)) return [];
  try {
    const cfg = JSON.parse(readFileSync(path, "utf8"));
    const list = cfg?.loop?.protected;
    return Array.isArray(list) ? list.filter((p) => typeof p === "string") : [];
  } catch {
    // A corrupt config must not silently disable protection. The floor still applies.
    return [];
  }
}

function globToRegExp(pattern) {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        out += ".*";
        i++;
        if (pattern[i + 1] === "/") i++; // `a/**/b` and `a/**` both behave
      } else {
        out += "[^/]*";
      }
    } else if (c === "?") out += "[^/]";
    else out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

// Normalise to a repo-relative POSIX path so Windows backslashes and absolute paths compare
// the same as the forward-slash globs written in config.
//
// Backslashes are converted on every platform, deliberately. On Windows the harness sends
// backslash paths and the guard would match nothing without this. On POSIX a literal backslash
// in a filename is legal but pathological, and mistaking one for a separator can only ever
// over-block — the safe direction for a guard, and it keeps the behaviour (and its tests)
// identical on the machine you develop on and the one CI runs.
function normalise(p) {
  if (!p) return null;
  const abs = resolve(REPO_ROOT, String(p).replace(/\\/g, "/"));
  const rel = relative(REPO_ROOT, abs);
  if (rel.startsWith("..")) return null; // outside the repo — not ours to guard
  return rel.split(sep).join("/");
}

function isProtected(relPath, patterns) {
  if (!relPath) return null;
  for (const pattern of patterns) {
    const clean = pattern.replace(/^\.\//, "");
    if (relPath === clean) return pattern;
    // `docs/decisions/**` protects the directory itself as well as everything under it.
    if (clean.endsWith("/**") && relPath === clean.slice(0, -3)) return pattern;
    if (globToRegExp(clean).test(relPath)) return pattern;
  }
  return null;
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

// Exported for tests. The hook path below is a thin wrapper over this.
export function evaluate(toolName, toolInput, patterns) {
  const all = [...FLOOR, ...patterns];

  if (toolName === "Edit" || toolName === "Write" || toolName === "NotebookEdit") {
    const rel = normalise(toolInput?.file_path ?? toolInput?.notebook_path);
    const hit = isProtected(rel, all);
    return hit ? { blocked: true, path: rel, pattern: hit } : { blocked: false };
  }

  if (toolName === "Bash") {
    // Best-effort, and deliberately conservative. Shell cannot be parsed reliably, so this
    // blocks when a command both mentions a protected path AND looks like a write. It will
    // occasionally block a harmless command that merely greps a protected file — which is the
    // right direction to be wrong in.
    const command = String(toolInput?.command ?? "");
    if (!WRITE_INDICATORS.some((re) => re.test(command))) return { blocked: false };

    for (const pattern of all) {
      const literal = pattern.replace(/\/?\*\*?.*$/, "").replace(/^\.\//, "");
      if (!literal) continue;
      if (command.includes(literal)) {
        return { blocked: true, path: literal, pattern, viaShell: true };
      }
    }
    return { blocked: false };
  }

  return { blocked: false };
}

async function main() {
  let payload;
  try {
    payload = JSON.parse(await readStdin());
  } catch {
    // Malformed hook input is a harness problem, not an attack. Do not block normal work.
    process.exit(0);
  }

  const result = evaluate(payload.tool_name, payload.tool_input, readConfigProtected());
  if (!result.blocked) process.exit(0);

  const how = result.viaShell
    ? `This shell command appears to modify ${result.path}`
    : `${result.path} is protected`;

  deny(
    `${how} (matched "${result.pattern}" in formwork.config.json → loop.protected).\n\n` +
      `Protected files are the rules the agent works under — the rulebook, the config, the ` +
      `gates, and this guard. An agent able to edit them has no constraints at all.\n\n` +
      `If this change is genuinely needed, ask the user to make it. Do not work around the ` +
      `guard by another route.`,
  );
}

// Only run the hook when executed directly, so the test file can import `evaluate`.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
