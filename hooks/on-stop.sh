#!/bin/bash
# Topside hook: Claude Code session stopped
# Logs a progress event to the matching stream's events.jsonl

set -euo pipefail

STREAMS_DIR="${STREAMS_DIR:-$HOME/.streams}"
INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
STOP_REASON=$(echo "$INPUT" | jq -r '.stop_reason // "completed"')

[ -z "$CWD" ] && exit 0

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

for stream_dir in "$STREAMS_DIR"/active/*/; do
  [ -f "${stream_dir}stream.json" ] || continue
  worktree=$(jq -r '.worktree // empty' "${stream_dir}stream.json" 2>/dev/null)
  [ -z "$worktree" ] && continue
  worktree="${worktree/#\~/$HOME}"

  if [ "$CWD" = "$worktree" ] || [[ "$CWD" == "$worktree"/* ]]; then
    if [ "$STOP_REASON" = "user_input" ]; then
      msg="Claude Code paused — waiting for user input"
      event_type="needs_input"
      # Mark stream as waiting
      jq '.status = "waiting"' "${stream_dir}stream.json" > "${stream_dir}stream.json.tmp" \
        && mv "${stream_dir}stream.json.tmp" "${stream_dir}stream.json"
    else
      msg="Claude Code session completed"
      event_type="progress"
    fi
    echo "{\"type\":\"$event_type\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"$msg\"}" >> "${stream_dir}events.jsonl"
    break
  fi
done

exit 0
