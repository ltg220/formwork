// Tests for the protected-file guard.
//
// This guard is the only thing standing between an unattended agent and its own rulebook, so
// its failure mode is silent and total: if it stops blocking, nothing else notices. These
// tests exist to make that failure loud.

import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluate } from "./guard.mjs";

const CONFIGURED = ["docs/rules.md", "docs/decisions/**", "scripts/**"];

const edit = (file, patterns = CONFIGURED) => evaluate("Edit", { file_path: file }, patterns);
const bash = (cmd, patterns = CONFIGURED) => evaluate("Bash", { command: cmd }, patterns);

test("blocks direct edits to the rulebook", () => {
  assert.equal(edit("CLAUDE.md").blocked, true);
});

test("the floor holds even when the config lists nothing", () => {
  // The critical case: if keel.config.json is emptied, corrupted, or its protection list is
  // stripped, the rulebook and the guard itself must still be defended.
  for (const file of ["CLAUDE.md", "keel.config.json", ".claude/settings.json", "scripts/guard.mjs"]) {
    assert.equal(edit(file, []).blocked, true, `${file} was not protected by the floor`);
  }
});

test("the guard cannot be edited to disable itself", () => {
  assert.equal(edit("scripts/guard.mjs", []).blocked, true);
});

test("glob patterns match files beneath the directory", () => {
  assert.equal(edit("docs/decisions/0001-harness-language.md").blocked, true);
  assert.equal(edit("scripts/gates.mjs").blocked, true);
  assert.equal(edit("scripts/lib/config.mjs").blocked, true);
});

test("a `dir/**` pattern also protects the directory itself", () => {
  assert.equal(edit("docs/decisions").blocked, true);
});

test("ordinary project files are left alone", () => {
  for (const file of ["src/main.ts", "docs/known-issues.md", "README.md", "tasks/queue.md"]) {
    assert.equal(edit(file).blocked, false, `${file} should not be blocked`);
  }
});

test("absolute and backslash paths normalise to the same decision", () => {
  // Windows hands over absolute paths with backslashes; the globs are written with forward
  // slashes. If normalisation breaks, the guard silently stops matching anything on Windows.
  const abs = evaluate("Edit", { file_path: process.cwd() + "/CLAUDE.md" }, []);
  assert.equal(abs.blocked, true);
  const backslash = evaluate("Edit", { file_path: "docs\\decisions\\0001-x.md" }, CONFIGURED);
  assert.equal(backslash.blocked, true);
});

test("Write and NotebookEdit are covered, not just Edit", () => {
  assert.equal(evaluate("Write", { file_path: "CLAUDE.md" }, []).blocked, true);
  assert.equal(evaluate("NotebookEdit", { notebook_path: "CLAUDE.md" }, []).blocked, true);
});

test("shell writes to protected paths are caught", () => {
  // Guarding Edit and Write alone would be trivially bypassed by shelling out.
  assert.equal(bash("echo hacked > CLAUDE.md").blocked, true);
  assert.equal(bash("sed -i 's/x/y/' keel.config.json").blocked, true);
  assert.equal(bash("rm docs/decisions/0001-harness-language.md").blocked, true);
  assert.equal(bash("cp /tmp/evil scripts/gates.mjs").blocked, true);
});

test("read-only shell commands touching protected paths are allowed", () => {
  // Being wrong in the blocking direction is acceptable; blocking every mention of a protected
  // file would make the repo unworkable.
  assert.equal(bash("cat CLAUDE.md").blocked, false);
  assert.equal(bash("grep -n rule CLAUDE.md").blocked, false);
  assert.equal(bash("node scripts/gates.mjs").blocked, false);
});

test("unrelated tools are not intercepted", () => {
  assert.equal(evaluate("Read", { file_path: "CLAUDE.md" }, []).blocked, false);
  assert.equal(evaluate("Grep", { pattern: "x" }, []).blocked, false);
});

test("paths outside the repo are not our business", () => {
  assert.equal(evaluate("Edit", { file_path: "/etc/hosts" }, []).blocked, false);
});

test("a blocked result explains which pattern matched", () => {
  // The reason is shown to the agent. Without the pattern it reads as an arbitrary refusal,
  // and an agent that does not understand a refusal tends to route around it.
  const result = edit("CLAUDE.md");
  assert.ok(result.pattern, "no pattern reported");
  assert.ok(result.path, "no path reported");
});
