#!/bin/bash
# Topside hook: Claude Code sent a notification (needs attention)
# Marks the matching stream as "waiting" and logs the event

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
    echo "{\"type\":\"needs_input\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"Claude Code needs attention\"}" >> "${stream_dir}events.jsonl"
    jq '.status = "waiting"' "${stream_dir}stream.json" > "${stream_dir}stream.json.tmp" \
      && mv "${stream_dir}stream.json.tmp" "${stream_dir}stream.json"
    break
  fi
done

exit 0
