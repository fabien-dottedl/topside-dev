#!/bin/bash
# Topside hook: Claude Code session started
# Logs a session_started event and sets stream status to "active"
# Auto-creates a stream if no matching stream exists for the CWD

set -euo pipefail

STREAMS_DIR="${STREAMS_DIR:-$HOME/.streams}"
LOG_FILE="$STREAMS_DIR/hooks.log"
HOOK_NAME="on-session-start"
log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $HOOK_NAME: $*" >> "$LOG_FILE"; }

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

[ -z "$CWD" ] && exit 0

log "CWD=$CWD"

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
MATCHED=false

for stream_dir in "$STREAMS_DIR"/active/*/; do
  [ -f "${stream_dir}stream.json" ] || continue
  worktree=$(jq -r '.worktree // empty' "${stream_dir}stream.json" 2>/dev/null)
  [ -z "$worktree" ] && continue
  worktree="${worktree/#\~/$HOME}"

  if [ "$CWD" = "$worktree" ] || [[ "$CWD" == "$worktree"/* ]]; then
    STREAM_ID=$(jq -r '.id // "unknown"' "${stream_dir}stream.json" 2>/dev/null)
    log "matched stream \"$STREAM_ID\""
    echo "{\"type\":\"session_started\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"Claude Code session started\"}" >> "${stream_dir}events.jsonl"
    # Set stream back to active (in case it was waiting)
    jq '.status = "active"' "${stream_dir}stream.json" > "${stream_dir}stream.json.tmp" \
      && mv "${stream_dir}stream.json.tmp" "${stream_dir}stream.json"
    MATCHED=true
    break
  fi
done

# Auto-create stream if no match found
if [ "$MATCHED" = false ]; then
  STREAM_ID=$(basename "$CWD")
  STREAM_DIR="$STREAMS_DIR/active/$STREAM_ID"
  log "no match, creating stream \"$STREAM_ID\""

  mkdir -p "$STREAM_DIR"

  cat > "$STREAM_DIR/stream.json" <<EOJSON
{
  "id": "$STREAM_ID",
  "title": "$STREAM_ID",
  "status": "active",
  "repo": null,
  "branch": null,
  "worktree": "$CWD",
  "createdAt": "$TIMESTAMP"
}
EOJSON

  echo "{\"type\":\"stream_created\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"Stream auto-created from session start\"}" > "$STREAM_DIR/events.jsonl"
  echo "{\"type\":\"session_started\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"Claude Code session started\"}" >> "$STREAM_DIR/events.jsonl"
  echo "# $STREAM_ID" > "$STREAM_DIR/scope.md"
  touch "$STREAM_DIR/notes.md"

  log "created stream at $STREAM_DIR"
fi

exit 0
