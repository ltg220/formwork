#!/usr/bin/env bash
# formwork — parallel lanes via git worktrees.
#
# Running two or three agent sessions against ONE working tree causes constant push races and
# cross-session file bleed: session A stages session B's half-finished edits, and the commit
# that lands belongs to neither. The fix is physical isolation — one directory per lane.
#
#   bash scripts/worktree.sh <lane>     create or reuse worktrees/<lane>
#   bash scripts/worktree.sh list       show every lane and its branch
#   bash scripts/worktree.sh clean      remove lanes whose branch is merged
#
# Idempotent by design: running it twice for the same lane reuses the existing worktree rather
# than failing or making a second one. Lanes are meant to be long-lived and reused across
# sessions, not created per session.

set -euo pipefail

BASE_BRANCH="${FORMWORK_BASE_BRANCH:-main}"
ROOT="$(git rev-parse --show-toplevel)"
WT_DIR="$ROOT/worktrees"

# Dependency directories are large and reproducible, so they are shared by link rather than
# reinstalled per lane. Add to this list for other ecosystems (vendor, .venv, target).
LINK_DIRS=("node_modules")

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

require_clean_ref() {
  if ! git show-ref --verify --quiet "refs/remotes/origin/$BASE_BRANCH"; then
    if git show-ref --verify --quiet "refs/heads/$BASE_BRANCH"; then
      echo "note: origin/$BASE_BRANCH not found, branching from local $BASE_BRANCH" >&2
      echo "$BASE_BRANCH"
      return
    fi
    echo "error: neither origin/$BASE_BRANCH nor $BASE_BRANCH exists." >&2
    echo "       Set FORMWORK_BASE_BRANCH to your default branch." >&2
    exit 1
  fi
  echo "origin/$BASE_BRANCH"
}

link_deps() {
  local target="$1"
  for dir in "${LINK_DIRS[@]}"; do
    [ -d "$ROOT/$dir" ] || continue
    [ -e "$target/$dir" ] && continue
    # Windows (Git Bash) cannot make a POSIX symlink to a directory without elevation, so use
    # a junction there. Failure is non-fatal: a lane with its own install still works.
    if [ -n "${WINDIR:-}" ]; then
      cmd //c mklink //J "$(cygpath -w "$target/$dir")" "$(cygpath -w "$ROOT/$dir")" >/dev/null 2>&1 \
        && echo "  linked $dir (junction)" \
        || echo "  could not link $dir — run your install inside the lane"
    else
      ln -s "$ROOT/$dir" "$target/$dir" && echo "  linked $dir (symlink)"
    fi
  done
}

cmd_create() {
  local lane="$1"
  local target="$WT_DIR/$lane"

  if [ -d "$target" ]; then
    echo "Lane '$lane' already exists — reusing it."
    echo "  $target"
    exit 0
  fi

  local base
  base="$(require_clean_ref)"

  mkdir -p "$WT_DIR"

  if git show-ref --verify --quiet "refs/heads/$lane"; then
    echo "Branch '$lane' exists — checking it out into a new lane."
    git worktree add "$target" "$lane"
  else
    echo "Creating lane '$lane' from $base."
    git worktree add -b "$lane" "$target" "$base"
  fi

  link_deps "$target"

  echo
  echo "Lane ready:"
  echo "  cd worktrees/$lane"
  echo
  echo "Commit and push early — 'worktree.sh clean' removes lanes, and uncommitted work in a"
  echo "removed lane is gone."
}

cmd_list() {
  if [ ! -d "$WT_DIR" ]; then
    echo "No lanes."
    exit 0
  fi
  git worktree list | while read -r path rest; do
    case "$path" in
      "$WT_DIR"/*) echo "  $(basename "$path")  $rest" ;;
    esac
  done
}

cmd_clean() {
  [ -d "$WT_DIR" ] || { echo "No lanes."; exit 0; }

  local base
  base="$(require_clean_ref)"
  local removed=0

  for path in "$WT_DIR"/*; do
    [ -d "$path" ] || continue
    local lane
    lane="$(basename "$path")"

    if ! git branch --merged "$base" --format='%(refname:short)' | grep -qx "$lane"; then
      echo "  keep   $lane (not merged into $BASE_BRANCH)"
      continue
    fi

    # Never remove a lane holding uncommitted work, even a merged one — the branch being
    # merged says nothing about files still dirty in that directory.
    if [ -n "$(git -C "$path" status --porcelain 2>/dev/null)" ]; then
      echo "  keep   $lane (merged, but has uncommitted changes)"
      continue
    fi

    echo "  remove $lane"
    git worktree remove "$path"
    git branch -d "$lane" >/dev/null 2>&1 || true
    removed=$((removed + 1))
  done

  echo
  echo "Removed $removed lane(s)."
}

case "${1:-}" in
  ""|-h|--help|help) usage ;;
  list)  cmd_list ;;
  clean) cmd_clean ;;
  *)     cmd_create "$1" ;;
esac
