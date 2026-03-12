# Topside

A personal dashboard for managing multiple Claude Code sessions in parallel. See all your active work streams, day plan, ideas, and GitHub notifications in one place — updated in real-time.

## Quick Start

```bash
git clone git@github.com:fabien-dottedl/topside-dev.git
cd topside-dev
pnpm install
pnpm setup          # creates ~/.streams/, configures Claude Code hooks
```

The setup script will tell you if your `GROQ_API_KEY` is missing. Add it to `.env`, then:

```bash
pnpm seed           # optional — loads sample data so you can explore
pnpm dev            # starts the dashboard at http://localhost:5173
```

That's it. Open [localhost:5173](http://localhost:5173).

---

## What `pnpm setup` Does

The setup script handles everything:

1. **Creates `~/.streams/`** — the directory structure where all state lives
2. **Installs Claude Code hooks** — copies hook scripts to `~/.streams/hooks/` and registers them in `~/.claude/settings.json`
3. **Creates `.env`** from the template if it doesn't exist
4. **Checks your Groq API key** and tells you if it's missing

It's safe to run multiple times — it skips anything already configured.

To run setup without configuring hooks (e.g. on a machine without Claude Code):

```bash
pnpm setup -- --skip-hooks
```

---

## Groq API Key

The chat assistant uses Groq for fast, cheap AI inference. You need a key:

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / log in
3. **API Keys** → **Create API Key**
4. Paste into `.env`:

```env
GROQ_API_KEY=gsk_your_key_here
```

Groq's free tier is generous — Topside costs fractions of a cent per request.

---

## GitHub Notifications

To see GitHub notifications on the dashboard, authenticate the `gh` CLI and run:

```bash
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

For auto-refresh, add to your crontab (`crontab -e`):

```
*/5 * * * * gh api notifications --jq '[.[] | {id:.id,type:.subject.type,repo:.repository.full_name,title:.subject.title,url:.subject.url,reason:.reason,unread:.unread,updated_at:.updated_at}]' > ~/.streams/github/notifications.json 2>/dev/null
```

---

## How Streams Work

A **stream** is a unit of work — a feature, bug fix, or spike. Each one lives as a directory in `~/.streams/active/`:

```
~/.streams/active/feat-rbac-v2/
├── stream.json      # metadata (title, status, repo, branch, worktree path)
├── events.jsonl     # timeline of what happened
├── scope.md         # what this stream is about
└── notes.md         # running notes
```

The `worktree` field in `stream.json` is what connects a Claude Code session to a stream. When Claude Code is running in that directory, the hooks automatically track it.

### Stream Lifecycle

| Status | Meaning | Dashboard color |
|--------|---------|-----------------|
| `active` | Being worked on | Green |
| `waiting` | Claude Code needs your input | Amber |
| `paused` | Set aside temporarily | Blue |
| `completed` | Done | Gray |
| `error` | Something went wrong | Red |

---

## Starting a New Stream

### 1. Create the stream

Use the chat drawer:

> "Create a stream for adding webhook support in acme-corp/platform on branch feat/webhooks"

Or manually:

```bash
mkdir -p ~/.streams/active/add-webhooks
cat > ~/.streams/active/add-webhooks/stream.json << 'EOF'
{
  "id": "add-webhooks",
  "title": "Add Webhook Support",
  "status": "active",
  "created": "2026-03-12T09:00:00Z",
  "repo": "acme-corp/platform",
  "branch": "feat/webhooks",
  "worktree": "~/worktrees/platform-webhooks"
}
EOF
```

### 2. Set up a git worktree

```bash
cd ~/code/acme-corp/platform
git worktree add ~/worktrees/platform-webhooks -b feat/webhooks
```

### 3. Start Claude Code in the worktree

```bash
cd ~/worktrees/platform-webhooks
claude
```

The hooks installed by `pnpm setup` will automatically:
- Log a `session_started` event when Claude Code starts
- Mark the stream as `waiting` when Claude Code needs input
- Log a `progress` event when Claude Code completes

You'll see all of this on the dashboard in real-time.

### 4. Complete the stream

Via chat:

> "Mark the webhooks stream as completed"

Or via the terminal:

```bash
mv ~/.streams/active/add-webhooks ~/.streams/completed/
```

---

## Using the Chat Assistant

The chat drawer at the bottom connects to 5 AI agents:

| You say... | Agent |
|-----------|-------|
| "Plan my day" | Day Planner |
| "Create a stream for X" | Stream Manager |
| "What's the status of my streams?" | Stream Manager |
| "Check my GitHub notifications" | GitHub Monitor |
| "Capture an idea: offline mode" | Research & Ideas |
| "What ideas do I have?" | Research & Ideas |

A Coordinator agent routes your message to the right specialist. All agents can read and write to `~/.streams/`.

---

## How the Hooks Work

`pnpm setup` installs three hooks into Claude Code:

| Event | What it does |
|-------|-------------|
| **SessionStart** | Matches working directory to a stream, logs `session_started` event, sets status to `active` |
| **Notification** | Logs `needs_input` event, sets status to `waiting` |
| **Stop** | Logs `progress` event when Claude finishes. If stopped for user input, sets `waiting` instead |

The matching logic: each hook reads `stream.json` from every directory in `~/.streams/active/`, compares the `worktree` field against the current working directory. If it matches (exact or subdirectory), the event is logged to that stream.

Hook scripts live at `~/.streams/hooks/` and can be edited. Run `pnpm setup` again to reset them to defaults.

---

## Filesystem Layout

```
~/.streams/
├── config.json                 # Global config
├── day-plan.md                 # Today's plan (rendered on dashboard)
├── active/                     # Active streams
│   └── feat-rbac-v2/
│       ├── stream.json
│       ├── events.jsonl
│       ├── scope.md
│       └── notes.md
├── completed/                  # Archived streams
├── ideas/                      # Idea files with YAML frontmatter
├── notes/                      # Daily scratch notes
├── archive/plans/              # Old day plans
├── github/notifications.json   # GitHub notifications
└── hooks/                      # Claude Code hook scripts (installed by setup)
```

---

## Daily Workflow

**Morning** — Open the dashboard. Chat: *"Let's plan the day."* Start Claude Code sessions in your worktrees.

**During the day** — Work in Claude Code normally. Glance at the dashboard for stream status, blockers, and notifications. Use the chat drawer to think through problems or capture ideas. Toggle day plan checkboxes directly.

**End of day** — Chat: *"Debrief my day."* Archive completed streams.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Empty dashboard | Run `pnpm seed` to load sample data |
| "Disconnected" in header | Server not running — check `pnpm dev` output |
| Chat errors | Check `GROQ_API_KEY` in `.env` |
| Hooks not firing | Run `pnpm setup` to reinstall, then restart Claude Code |
| Port 4111 in use | `lsof -ti:4111 \| xargs kill` |
| Stream not showing | Check `stream.json` exists and has valid JSON |

---

## Scripts

| Command | What it does |
|---------|-------------|
| `pnpm setup` | First-time setup: directories, hooks, env check |
| `pnpm dev` | Start server + dashboard |
| `pnpm seed` | Load sample data into `~/.streams/` |
| `pnpm seed -- --clean` | Wipe and reload sample data |
