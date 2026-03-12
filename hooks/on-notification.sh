#!/bin/bash
# Topside hook: Claude Code sent a notification (needs attention)
# Marks the matching stream as "waiting" and logs the event

set -euo pipefail

STREAMS_DIR="${STREAMS_DIR:-$HOME/.streams}"
LOG_FILE="$STREAMS_DIR/hooks.log"
HOOK_NAME="on-notification"
log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $HOOK_NAME: $*" >> "$LOG_FILE"; }

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

[ -z "$CWD" ] && exit 0

log "CWD=$CWD"

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

for stream_dir in "$STREAMS_DIR"/active/*/; do
  [ -f "${stream_dir}stream.json" ] || continue
  worktree=$(jq -r '.worktree // empty' "${stream_dir}stream.json" 2>/dev/null)
  [ -z "$worktree" ] && continue
  worktree="${worktree/#\~/$HOME}"

  if [ "$CWD" = "$worktree" ] || [[ "$CWD" == "$worktree"/* ]]; then
    STREAM_ID=$(jq -r '.id // "unknown"' "${stream_dir}stream.json" 2>/dev/null)
    log "matched stream \"$STREAM_ID\""
    echo "{\"type\":\"needs_input\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"Claude Code needs attention\"}" >> "${stream_dir}events.jsonl"
    jq '.status = "waiting"' "${stream_dir}stream.json" > "${stream_dir}stream.json.tmp" \
      && mv "${stream_dir}stream.json.tmp" "${stream_dir}stream.json"
    break
  fi
done

exit 0
