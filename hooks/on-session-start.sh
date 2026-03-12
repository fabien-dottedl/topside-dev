#!/bin/bash
# Topside hook: Claude Code session started
# Logs a session_started event and sets stream status to "active"

set -euo pipefail

STREAMS_DIR="${STREAMS_DIR:-$HOME/.streams}"
INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

[ -z "$CWD" ] && exit 0

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

for stream_dir in "$STREAMS_DIR"/active/*/; do
  [ -f "${stream_dir}stream.json" ] || continue
  worktree=$(jq -r '.worktree // empty' "${stream_dir}stream.json" 2>/dev/null)
  [ -z "$worktree" ] && continue
  worktree="${worktree/#\~/$HOME}"

  if [ "$CWD" = "$worktree" ] || [[ "$CWD" == "$worktree"/* ]]; then
    echo "{\"type\":\"session_started\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"Claude Code session started\"}" >> "${stream_dir}events.jsonl"
    # Set stream back to active (in case it was waiting)
    jq '.status = "active"' "${stream_dir}stream.json" > "${stream_dir}stream.json.tmp" \
      && mv "${stream_dir}stream.json.tmp" "${stream_dir}stream.json"
    break
  fi
done

exit 0
