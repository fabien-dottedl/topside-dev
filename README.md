# Topside

A locally-hosted personal dashboard for managing multiple Claude Code sessions in parallel. Topside renders filesystem state from `~/.streams/`, provides a chat interface to AI agents, and updates in real-time via WebSocket file watching.

## Quick Start

```bash
git clone git@github.com:fabien-dottedl/topside-dev.git
cd topside-dev
pnpm install
cp .env.example .env        # then edit with your keys
pnpm seed                   # populate ~/.streams/ with sample data
pnpm dev                    # starts server (:4111) + client (:5173)
```

Open [http://localhost:5173](http://localhost:5173).

---

## Setup

### Prerequisites

- **Node.js** 20+
- **pnpm** (`npm install -g pnpm`)
- **Groq API key** (required — powers the AI agents)
- **Claude Code** (for running development streams)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy the example and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required — powers all Topside AI agents
GROQ_API_KEY=gsk_your_key_here

# Optional — for future Claude-based agent fallback
ANTHROPIC_API_KEY=

# Where stream data lives (default: ~/.streams)
STREAMS_DIR=~/.streams
```

**Getting a Groq API key:**

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Navigate to **API Keys** → **Create API Key**
4. Copy the key into your `.env`

Groq's free tier is generous. Topside uses `llama-3.3-70b-versatile` (standard agents) and `llama-4-scout-17b-16e-instruct` (fast routing), which cost fractions of a cent per request.

### 3. Seed Sample Data (Optional)

To see the dashboard in action with realistic data:

```bash
pnpm seed
```

This creates `~/.streams/` with sample streams, a day plan, ideas, notes, and GitHub notifications. Use `pnpm seed -- --clean` to wipe and re-create.

### 4. Run

```bash
pnpm dev
```

This starts:
- **Server** at `http://localhost:4111` (Express + WebSocket + AI agents)
- **Client** at `http://localhost:5173` (Vite + React dashboard)

The client proxies API requests to the server automatically.

---

## Filesystem Schema

All state lives in `~/.streams/`. No database. Every piece of data is a human-readable file.

```
~/.streams/
├── config.json                 # Global configuration
├── day-plan.md                 # Today's goals and priorities
├── active/                     # Currently active streams
│   └── feat-rbac-v2/
│       ├── stream.json         # Stream metadata
│       ├── events.jsonl        # Append-only event log
│       ├── scope.md            # Scoping document
│       └── notes.md            # Running notes
├── completed/                  # Finished streams
├── ideas/                      # Future work (markdown with frontmatter)
├── notes/                      # Daily scratch notes
├── archive/plans/              # Archived day plans
└── github/notifications.json   # GitHub notification cache
```

---

## Working with Streams

Streams are the core unit of work. Each stream maps to a task, feature, or fix — typically running in its own terminal with Claude Code.

### Creating a Stream via Chat

Open the chat drawer and ask:

> "Create a stream for refactoring the auth middleware"

The Stream Manager agent will create the directory structure in `~/.streams/active/` and it appears on the dashboard immediately.

### Creating a Stream Manually

```bash
mkdir -p ~/.streams/active/refactor-auth-middleware
cat > ~/.streams/active/refactor-auth-middleware/stream.json << 'EOF'
{
  "id": "refactor-auth-middleware",
  "title": "Refactor Auth Middleware",
  "status": "active",
  "created": "2026-03-12T09:00:00.000Z",
  "repo": "acme-corp/api-gateway",
  "branch": "refactor/auth-middleware",
  "worktree": "~/worktrees/api-gateway-auth"
}
EOF
```

The dashboard picks it up instantly via file watching.

### Stream Lifecycle

| Status | Meaning |
|--------|---------|
| `active` | Currently being worked on |
| `waiting` | Needs user input — Claude Code is blocked |
| `paused` | Temporarily set aside |
| `completed` | Done, ready to archive |
| `error` | Something went wrong |

### Logging Events

Append events to a stream's `events.jsonl`:

```bash
echo '{"type":"progress","timestamp":"2026-03-12T10:30:00Z","message":"Completed middleware extraction"}' \
  >> ~/.streams/active/refactor-auth-middleware/events.jsonl
```

---

## Connecting Claude Code Sessions

The real power of Topside is seeing your Claude Code sessions reflected on the dashboard. Here's how to wire them up.

### Option A: Claude Code Hooks (Recommended)

Claude Code supports lifecycle hooks — scripts that run on specific events. Add these to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "on-session-start": [
      {
        "command": "~/.streams/hooks/on-session-start.sh"
      }
    ],
    "on-notification": [
      {
        "command": "~/.streams/hooks/on-notification.sh"
      }
    ]
  }
}
```

Create the hook scripts:

**`~/.streams/hooks/on-session-start.sh`** — Registers the session with its stream:

```bash
#!/bin/bash
# Match current working directory to a stream by worktree path
STREAMS_DIR="$HOME/.streams/active"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

for stream_dir in "$STREAMS_DIR"/*/; do
  [ -f "$stream_dir/stream.json" ] || continue
  worktree=$(python3 -c "import json,sys; print(json.load(open('${stream_dir}stream.json')).get('worktree',''))" 2>/dev/null)
  # Expand ~ in worktree path
  worktree="${worktree/#\~/$HOME}"
  if [ "$PWD" = "$worktree" ] || [[ "$PWD" == "$worktree"/* ]]; then
    echo "{\"type\":\"session_started\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"Claude Code session started\"}" >> "${stream_dir}events.jsonl"
    break
  fi
done
```

**`~/.streams/hooks/on-notification.sh`** — Marks stream as waiting when Claude Code needs input:

```bash
#!/bin/bash
STREAMS_DIR="$HOME/.streams/active"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

for stream_dir in "$STREAMS_DIR"/*/; do
  [ -f "$stream_dir/stream.json" ] || continue
  worktree=$(python3 -c "import json,sys; print(json.load(open('${stream_dir}stream.json')).get('worktree',''))" 2>/dev/null)
  worktree="${worktree/#\~/$HOME}"
  if [ "$PWD" = "$worktree" ] || [[ "$PWD" == "$worktree"/* ]]; then
    echo "{\"type\":\"needs_input\",\"timestamp\":\"$TIMESTAMP\",\"message\":\"Claude Code needs input\"}" >> "${stream_dir}events.jsonl"
    # Update status to waiting
    python3 -c "
import json
f = '${stream_dir}stream.json'
d = json.load(open(f))
d['status'] = 'waiting'
json.dump(d, open(f, 'w'), indent=2)
"
    break
  fi
done
```

Make them executable:

```bash
chmod +x ~/.streams/hooks/on-session-start.sh
chmod +x ~/.streams/hooks/on-notification.sh
```

### Option B: CLAUDE.md Instructions

Add instructions to your project's `CLAUDE.md` so Claude Code writes to `~/.streams/` as it works:

```markdown
## Stream Tracking

This project uses Topside for work tracking. When working on a task:

1. At the start of a session, append to the stream's events.jsonl:
   echo '{"type":"session_started","timestamp":"<ISO>","message":"Started working on <description>"}' >> ~/.streams/active/<stream-id>/events.jsonl

2. After completing a significant milestone:
   echo '{"type":"progress","timestamp":"<ISO>","message":"<what was done>"}' >> ~/.streams/active/<stream-id>/events.jsonl

3. When blocked or needing input:
   echo '{"type":"needs_input","timestamp":"<ISO>","message":"<what is needed>"}' >> ~/.streams/active/<stream-id>/events.jsonl
```

### Option C: Manual Workflow

Start your Claude Code session, then manually track in a separate terminal:

```bash
# Quick status update
echo '{"type":"progress","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","message":"PR opened for review"}' \
  >> ~/.streams/active/feat-rbac-v2/events.jsonl
```

---

## Starting a New Stream of Work — Full Walkthrough

Here's the complete flow for starting a new piece of work:

### 1. Create the Stream

Open the Topside chat drawer and say:

> "Create a new stream called 'Add webhook system' for the acme-corp/platform repo on branch feat/webhooks"

Or create it manually:

```bash
STREAM_ID="add-webhook-system"
mkdir -p ~/.streams/active/$STREAM_ID
cat > ~/.streams/active/$STREAM_ID/stream.json << EOF
{
  "id": "$STREAM_ID",
  "title": "Add Webhook System",
  "status": "active",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "repo": "acme-corp/platform",
  "branch": "feat/webhooks",
  "worktree": "~/worktrees/platform-webhooks"
}
EOF
```

### 2. Set Up Your Worktree

```bash
cd ~/code/acme-corp/platform
git worktree add ~/worktrees/platform-webhooks -b feat/webhooks
```

### 3. Start Claude Code

```bash
cd ~/worktrees/platform-webhooks
claude
```

If you've configured hooks (Option A above), the session is automatically tracked. If not, use CLAUDE.md or manual logging.

### 4. Work

Work normally in Claude Code. The dashboard updates in real-time as events are logged to `~/.streams/`. Switch to the Topside dashboard to see:

- Stream status on the card row
- Event timeline when you click a stream
- Day plan progress

### 5. Complete the Stream

When done, use the chat drawer:

> "Mark the webhook system stream as completed"

Or manually:

```bash
# Update status
python3 -c "
import json
f = '$HOME/.streams/active/add-webhook-system/stream.json'
d = json.load(open(f))
d['status'] = 'completed'
json.dump(d, open(f, 'w'), indent=2)
"

# Move to completed
mv ~/.streams/active/add-webhook-system ~/.streams/completed/
```

---

## Using the Chat Assistant

The chat drawer at the bottom of the dashboard connects to a Coordinator agent that routes requests to specialist agents:

| Say something like... | Handled by |
|----------------------|------------|
| "Plan my day" | Day Planner |
| "What's on my plate?" | Day Planner |
| "Create a stream for X" | Stream Manager |
| "What's the status of all streams?" | Stream Manager |
| "Check my GitHub notifications" | GitHub Monitor |
| "Capture an idea: offline mode for the mobile app" | Research & Ideas |
| "What ideas do I have?" | Research & Ideas |

The agents have full read/write access to `~/.streams/` — they can create streams, update plans, log events, and capture ideas.

---

## GitHub Notifications

In V0, GitHub notifications are read from a local JSON file. To populate it, you can set up a cron job or run manually:

```bash
# Fetch notifications (requires gh CLI authenticated)
gh api notifications --jq '[.[] | {
  id: .id,
  type: .subject.type,
  repo: .repository.full_name,
  title: .subject.title,
  url: .subject.url,
  reason: .reason,
  unread: .unread,
  updated_at: .updated_at
}]' > ~/.streams/github/notifications.json
```

Or add to crontab for auto-refresh:

```bash
# Every 5 minutes
*/5 * * * * gh api notifications --jq '[.[] | {id:.id,type:.subject.type,repo:.repository.full_name,title:.subject.title,url:.subject.url,reason:.reason,unread:.unread,updated_at:.updated_at}]' > ~/.streams/github/notifications.json 2>/dev/null
```

---

## Daily Workflow

### Morning

1. Open `http://localhost:5173` on your second monitor
2. Open the chat drawer: *"Let's plan the day. I need to finish the auth refactor, the webhook system is blocked on API design, and I want to spike caching."*
3. The Day Planner writes your plan → dashboard updates live
4. Open terminal tabs, start Claude Code sessions in each worktree

### During the Day

5. Work in Claude Code as normal — Topside tracks everything
6. Glance at the dashboard to see stream status, blockers, notifications
7. Use the chat drawer to think through problems, capture ideas, update plans
8. Toggle day plan checkboxes directly on the dashboard

### End of Day

9. Chat: *"Debrief my day"* → get a summary of what was done
10. Archive completed streams, carry over incomplete goals

---

## Project Structure

```
topside-dev/
├── server/
│   ├── index.ts              # Express + HTTP server entry point
│   ├── websocket.ts          # WebSocket servers (file changes + chat)
│   ├── file-watcher.ts       # chokidar watching ~/.streams/
│   ├── lib/
│   │   ├── paths.ts          # Resolves STREAMS_DIR
│   │   └── parsers.ts        # JSON/JSONL/frontmatter parsers
│   ├── routes/
│   │   ├── streams.ts        # GET /api/streams, GET /api/streams/:id
│   │   ├── day-plan.ts       # GET/PUT /api/day-plan
│   │   ├── ideas.ts          # GET /api/ideas, GET /api/ideas/:id
│   │   ├── github.ts         # GET /api/github/notifications
│   │   └── chat.ts           # POST /api/chat (SSE streaming)
│   └── agents/
│       ├── index.ts           # Mastra instance with all agents
│       ├── coordinator.ts     # Routes requests to specialists
│       ├── day-planner.ts     # Day plan lifecycle
│       ├── stream-manager.ts  # Stream CRUD
│       ├── github-monitor.ts  # Notification triage
│       ├── research-ideas.ts  # Ideas + notes
│       └── tools/             # Agent filesystem tools
├── client/
│   ├── src/
│   │   ├── App.tsx            # Main app with real-time wiring
│   │   ├── components/        # Dashboard panels + chat drawer
│   │   ├── hooks/             # Data fetching + WebSocket
│   │   ├── lib/api.ts         # REST client
│   │   └── types/             # Shared TypeScript interfaces
│   └── vite.config.ts
├── scripts/
│   └── seed-data.ts           # Sample data generator
└── .env.example
```

---

## Troubleshooting

**Dashboard shows empty panels**
→ Run `pnpm seed` to create sample data, or check that `~/.streams/` exists.

**"Disconnected" indicator in header**
→ The Express server isn't running. Check `pnpm dev` output for errors.

**Chat returns errors**
→ Verify `GROQ_API_KEY` is set in `.env`. Check server logs for details.

**File changes not updating the dashboard**
→ The WebSocket connection may have dropped. Refresh the page — it auto-reconnects.

**Port 4111 already in use**
→ Kill the existing process: `lsof -ti:4111 | xargs kill`
