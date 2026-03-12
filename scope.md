# Topside — Complete Specification

## A Personal Command Centre for AI-Assisted Software Development

**Project:** Topside
**Repo:** `topside-dev`

**Version:** 1.0
**Date:** 2026-03-12
**Status:** Ready for V0 implementation

---

## Table of Contents

1. [Problem & Motivation](#1-problem--motivation)
2. [What We're Building](#2-what-were-building)
3. [Design Principles](#3-design-principles)
4. [Architecture Overview](#4-architecture-overview)
5. [Filesystem Schema](#5-filesystem-schema)
6. [Agent Architecture](#6-agent-architecture)
7. [Dashboard UI](#7-dashboard-ui)
8. [Server Layer](#8-server-layer)
9. [Autonomous Idea Exploration](#9-autonomous-idea-exploration)
10. [Claude Code Hooks](#10-claude-code-hooks)
11. [The Daily Workflow](#11-the-daily-workflow)
12. [Technical Stack](#12-technical-stack)
13. [Cost Model](#13-cost-model)
14. [V0 Implementation Scope](#14-v0-implementation-scope)
15. [V1 Roadmap](#15-v1-roadmap)
16. [Open Questions](#16-open-questions)
17. [Seed Data Script](#17-seed-data-script)

---

## 1. Problem & Motivation

Modern AI coding assistants like Claude Code have fundamentally changed how solo engineers work. A single developer can now run multiple parallel streams of work — feature development, bug fixes, spikes, refactoring — each in its own terminal session with an AI pair programmer. This is effectively running a small engineering team.

But the tooling hasn't caught up. Today, managing this workflow means:

**Terminal tab sprawl.** Three to four iTerm2 tabs, each running Claude Code in a different worktree or repo. Context lives in each tab but nowhere else. Switching between them means mentally reloading where each stream is at.

**Scoping documents lost in the terminal.** Many sessions start with a scoping phase that produces lengthy markdown files. Reviewing these in a terminal — scrolling, no formatting, no navigation — is a poor experience for documents that need careful reading.

**No single view of the day.** Goals, active streams, blocked work, completed tasks, GitHub notifications — all of this exists but scattered across terminals, browser tabs, and mental notes. There's no "standup board" for a solo engineer running AI-assisted parallel work.

**Context switching tax.** The biggest cost isn't the work itself — it's the overhead of remembering what each stream is doing, which ones need attention, and what to work on next. This is the exact problem a tech lead solves for a team, but nobody is doing it for the solo AI-assisted engineer.

**Interaction model mismatch.** Working with Claude Code through markdown files and terminal commands doesn't match how you'd naturally coordinate with a team. You wouldn't hand engineers raw markdown and wait — you'd have conversations, a shared board, status updates.

### Why This Matters

The bottleneck has shifted. With AI coding assistants, the constraint is no longer typing speed or implementation capacity — it's orchestration. The engineer's job increasingly looks like a tech lead role: scoping work, reviewing output, making architectural decisions, and context-switching between streams. Without proper tooling for this new role, the productivity gains from AI assistance are capped by the engineer's ability to keep everything in their head.

This isn't a team collaboration problem. It's a single-person cognitive load problem.

---

## 2. What We're Building

A locally-hosted dashboard that lives on a dedicated monitor. Always open, always current. It serves as a personal command centre for an engineer running multiple Claude Code sessions in parallel.

### Core Concepts

**Streams** are the primary unit of work. A stream maps to a specific task or goal — "implement RBAC v2", "fix Bedrock SCP issue", "spike Tiptap editor". Each stream has an associated worktree/branch, a scoping document, status, and a trail of events. Streams are backed by simple files on disk.

**The Day Plan** is a living document of today's goals. It starts each morning and evolves throughout the day. Goals can be checked off, reprioritised, or added as new work emerges. It's a markdown file the dashboard renders and makes interactive.

**The Assistant** is a set of Mastra AI agents running on the server, accessible via a collapsible chat drawer at the bottom of the dashboard. It's the thinking partner — used for planning the day, scoping new streams, reviewing progress, brainstorming ideas. It runs primarily on Groq (Llama 4 models) for speed and low cost (~$1-3/month).

**Ideas** are future work that isn't ready to become a stream. They live as markdown files in a dedicated folder. They can be explored (including autonomously via Claude Code), expanded, and eventually promoted to active streams.

**Autonomous Exploration** allows the Research & Ideas agent to dispatch Claude Code sessions to investigate ideas against the codebase — assessing feasibility, identifying dependencies, estimating complexity — while the user focuses on other work. This runs on the user's Claude Code Max plan at no additional cost.

### What It Is Not

- Not a team tool. Single user only. No auth, no multi-user, no sharing.
- Not a terminal replacement. The actual coding work still happens in iTerm2. This dashboard monitors and orchestrates — it doesn't execute.
- Not a project management tool. No sprints, no story points, no velocity charts. It's a daily operational dashboard.
- Not over-engineered. Files on disk. A local web server. A React frontend. Mastra agents. That's it.

---

## 3. Design Principles

1. **Files are the API.** Everything is markdown or JSON on disk. No database, no proprietary formats. Claude Code can read and write it. You can read and write it. `cat` and `grep` work. The filesystem at `~/.streams/` is the single source of truth.

2. **Agents read, agents write.** The dashboard is primarily a viewer — it renders what's on disk. The intelligence layer (Mastra agents) handles complex operations: creating streams, writing scoping docs, summarising progress. The UI reflects the filesystem state accurately and in real-time.

3. **No over-engineering.** This is a personal tool for one engineer. No authentication, no multi-user support, no plugin system, no configuration UI. Settings go in a JSON file. If it needs more than `npm run dev` to start, it's too complex.

4. **Progressive disclosure.** The default view is calm — stream cards, day plan, GitHub feed. Detail (scoping docs, event timelines, the assistant drawer) is one click away but not in your face. The dashboard should reduce cognitive load, not add to it.

5. **Real-time but not noisy.** File system changes propagate to the UI via WebSocket. But there are no popup notifications, no sounds, no toast messages. Status badges update silently. You check the dashboard when you're ready to, and everything is current when you look.

6. **Fewer agents, well-scoped.** Each agent has a clear, non-overlapping responsibility. Agents don't call each other directly — they share state through the filesystem. The Coordinator routes, specialist agents act.

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Dashboard (React + Vite)                     │
│                                                          │
│  Stream cards · Day plan · GitHub feed · Doc viewer      │
│  Ideas panel · Notes                                     │
│  ─────────────────────────────────────────────────────── │
│  Collapsible AI assistant chat drawer (bottom bar)       │
└────────────┬─────────────────────────┬───────────────────┘
             │                         │
       WebSocket (chat)         WebSocket (file watch)
             │                         │
┌────────────┴─────────────────────────┴───────────────────┐
│              Local Server (Express)                        │
│                                                           │
│  Mastra Agent Runtime:                                    │
│    ├── Coordinator Agent (Groq: Llama 4 Scout)           │
│    ├── Day Planner Agent (Groq: Llama 4 Maverick)        │
│    ├── Stream Manager Agent (Groq: Llama 4 Maverick)     │
│    ├── GitHub Monitor Agent (Groq: Llama 4 Scout)        │
│    └── Research & Ideas Agent (Groq: Llama 4 Maverick)   │
│                                                           │
│  Services:                                                │
│    ├── FileWatcher (chokidar → WebSocket)                │
│    ├── GitHubPoller (Octokit, 60s interval)              │
│    └── ExplorationRunner (node-pty, Claude Code PTY)     │
│                                                           │
└────────────┬──────────────────────┬──────────────────────┘
             │                      │
       Groq API              File System (~/.streams/)
       (LLM inference)              ▲
                                    │
                              Hook scripts write events
                                    │
                              iTerm2 tabs
                           (Claude Code sessions — user's actual work)
```

### Data Flow

1. **User → Dashboard → Server → Agent → Filesystem:** User types in the chat drawer. The server routes the message through the Coordinator agent, which delegates to the appropriate specialist agent. The agent reads/writes files in `~/.streams/`. The FileWatcher detects changes and pushes updates to the dashboard via WebSocket.

2. **iTerm2 → Hooks → Filesystem → Dashboard:** Claude Code sessions in iTerm2 fire lifecycle hooks that write events to `~/.streams/active/{stream}/events.jsonl`. The FileWatcher picks these up and the dashboard updates stream cards in real-time.

3. **GitHub → Poller → Filesystem → Dashboard:** The GitHubPoller writes to `~/.streams/github/notifications.json`. The FileWatcher pushes updates to the dashboard's GitHub panel.

4. **Agent → ExplorationRunner → Claude Code → Filesystem → Dashboard:** The Research & Ideas agent triggers the ExplorationRunner, which spawns a background Claude Code PTY session. Claude Code writes exploration findings to `~/.streams/ideas/{id}/exploration.md`. The dashboard reflects the exploration status and results.

---

## 5. Filesystem Schema

All state lives in `~/.streams/`. No database. No remote storage. Every piece of data is a human-readable file.

```
~/.streams/
├── config.json                      # Global configuration
├── day-plan.md                      # Today's goals and priorities
│
├── active/                          # Currently active streams
│   ├── feat-rbac-v2/
│   │   ├── stream.json              # Stream metadata
│   │   ├── events.jsonl             # Append-only event log
│   │   ├── scope.md                 # Scoping document
│   │   └── notes.md                 # Running notes and decisions
│   └── fix-bedrock-scp/
│       └── ...
│
├── completed/                       # Archived streams
│   └── setup-new-relic/
│       └── ...
│
├── ideas/                           # Ideas backlog
│   ├── nestd-booking-engine.md      # Simple ideas: single file
│   ├── webhook-system/              # Explored ideas: directory
│   │   ├── idea.md                  # Original idea
│   │   ├── exploration.md           # Claude Code exploration findings
│   │   └── exploration-events.jsonl # Exploration session events
│   └── archive/
│       └── ...
│
├── notes/                           # Daily scratch notes
│   ├── 2026-03-12.md
│   └── ...
│
├── archive/                         # Historical data
│   └── plans/                       # Archived day plans
│       ├── 2026-03-11.md
│       └── ...
│
└── github/                          # GitHub state
    └── notifications.json           # Polled notifications
```

### File Formats

#### `config.json`

```json
{
  "github_token": "ghp_...",
  "watched_repos": ["dotted-line/platform", "dotted-line/portal"],
  "github_poll_interval": 60,
  "worktree_base_paths": ["/Users/fab/code/dotted-line/worktrees"],
  "default_model": "groq:llama-4-maverick",
  "timezone": "Africa/Johannesburg",
  "exploration": {
    "max_concurrent": 1,
    "timeout_minutes": 15,
    "claude_command": "claude",
    "priority": "interactive_sessions_first"
  }
}
```

#### `day-plan.md`

```markdown
# Day Plan — 2026-03-12

## Priority
- [x] Scope RBAC v2 migration {id: goal-1, stream: feat-rbac-v2}
- [ ] Fix Bedrock SCP blocking issue {id: goal-2, stream: fix-bedrock-scp}
- [ ] Review PR #142 and #138 {id: goal-3}

## If Time Allows
- [ ] Spike Tiptap editor integration {id: goal-4}
- [ ] Update DSPT documentation {id: goal-5}

## Notes
- Bedrock issue may require EcoVate to update the SCP — check with ops
- PR #138 has a merge conflict, might need rebasing first
```

#### `stream.json`

```json
{
  "id": "feat-rbac-v2",
  "name": "RBAC v2 Migration",
  "description": "Implement three-tier RBAC model with tenant isolation",
  "status": "active",
  "worktree_path": "/Users/fab/code/dotted-line/worktrees/feat-rbac-v2",
  "git_branch": "feat/rbac-v2",
  "iterm_session_id": "w0t1p0:E3A4B5C6-...",
  "created_at": "2026-03-11T08:30:00Z",
  "updated_at": "2026-03-11T14:22:00Z",
  "tags": ["backend", "security"]
}
```

Valid statuses: `active`, `waiting` (needs user input), `blocked`, `paused`, `completed`.

#### `events.jsonl`

One JSON object per line, append-only:

```jsonl
{"type":"started","ts":"2026-03-11T08:30:00Z","message":"Stream created"}
{"type":"progress","ts":"2026-03-11T09:15:00Z","message":"Completed schema design for tenant model"}
{"type":"needs_input","ts":"2026-03-11T10:42:00Z","message":"Should RLS policies apply at the organisation or team level?"}
{"type":"resumed","ts":"2026-03-11T10:45:00Z","message":"User responded: organisation level with team overrides"}
{"type":"task_complete","ts":"2026-03-11T12:00:00Z","message":"Migration script for tenant table complete, PR #145 created"}
```

Valid event types: `started`, `progress`, `needs_input`, `resumed`, `task_complete`, `error`, `paused`, `blocked`.

#### `github/notifications.json`

```json
{
  "last_poll": "2026-03-12T14:30:00Z",
  "items": [
    {
      "id": "notif-1",
      "type": "pr_review_requested",
      "repo": "dotted-line/platform",
      "title": "PR #142: Add contract versioning",
      "url": "https://github.com/dotted-line/platform/pull/142",
      "author": "teammate",
      "created_at": "2026-03-12T09:00:00Z",
      "read": false
    }
  ]
}
```

#### Idea files

Simple ideas are a single markdown file (`idea-name.md`). When an idea gets explored, it graduates to a directory:

```markdown
---
id: nestd-booking-engine
title: Nestd Booking Engine
tags: [nestd, side-project, feature]
status: exploring
created: 2026-03-08
updated: 2026-03-12
---

# Nestd Booking Engine

## Summary
Build a direct booking engine for the Nestd platform to reduce dependency on Airbnb/Booking.com.

## Context
Currently all bookings come through OTAs. A direct booking option would reduce commission costs.

## Open Questions
- Payment provider? Stripe is the obvious choice.
- Calendar sync with OTAs to avoid double-booking.
```

Valid idea statuses: `draft`, `exploring`, `explored`, `promoted`, `archived`.

---

## 6. Agent Architecture

Five Mastra agents, each with a focused responsibility. The Coordinator is the entry point — every user message goes through it.

### Principles

- **Filesystem first.** All persistent state lives in `~/.streams/`. Agents read and write there.
- **Mastra memory for conversational context.** Each agent maintains conversation threads for continuity without re-reading every file on every interaction. Memory is "short-term recall" — filesystem is "long-term record."
- **Mastra storage for agent working state.** Key-value storage for transient state (timestamps, counters, focus tracking) that doesn't belong in files.
- **Agents don't call each other directly.** The Coordinator delegates. Agents share state through the filesystem.
- **Groq as default provider.** All agents run on Groq. Claude API is available as an optional override for complex analysis, triggered explicitly.

### Model Configuration

```typescript
import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const models = {
  fast: groq('llama-4-scout-17b-16e-instruct'),
  standard: groq('llama-4-maverick-17b-128e-instruct'),
  deep: anthropic('claude-sonnet-4-6'), // optional fallback
};
```

### Agent 1: Coordinator

**Role:** Front door. Routes every user message. Handles simple queries directly, delegates complex tasks to specialist agents.

**Model:** `models.fast` (Scout — fast, cheap, most interactions are routing)

**Mastra memory:** One thread per day. Remembers the flow of the day — what was planned, discussed, decided.

**Mastra storage keys:**
- `coordinator:current_focus` — which stream the user is currently focused on
- `coordinator:today_thread_id` — active thread ID
- `coordinator:last_interaction` — timestamp for "welcome back" awareness

**Tools:**

| Tool | Description |
|---|---|
| `delegateToAgent(agentName, message)` | Hands off to a specialist agent, returns the response |
| `readFile(path)` | Reads any file from `~/.streams/` for quick lookups |
| `getCurrentTime()` | Returns current time for time-aware responses |

**Handles directly:** greetings, "what did we discuss earlier?" (reads own memory), simple factual lookups ("what branch is the RBAC stream on?"), ambiguous queries needing clarification.

**Delegates to:** Day Planner (goals, priorities, schedule), Stream Manager (streams, status, creation), Research & Ideas (brainstorming, ideas, notes, exploration), GitHub Monitor (PRs, issues, notifications).

**Routing examples:**

| User says | Coordinator action |
|---|---|
| "Good morning, let's plan the day" | → Day Planner |
| "Create a new stream for the Tiptap editor spike" | → Stream Manager |
| "What's happening across my streams?" | → Stream Manager |
| "Any PRs waiting for me?" | → GitHub Monitor |
| "Idea: we should build a webhook system" | → Research & Ideas |
| "What should I focus on next?" | → Day Planner |
| "Note: ops team said SCP will be fixed Thursday" | → Research & Ideas |
| "How's the RBAC stream going?" | → Stream Manager |
| "Debrief my day" | → Day Planner |
| "Explore the webhook idea against the platform repo" | → Research & Ideas |

---

### Agent 2: Day Planner

**Role:** Owns the day plan. Morning planning, mid-day reprioritisation, end-of-day debrief.

**Model:** `models.standard` (Maverick — needs reasoning for prioritisation)

**Mastra memory:** One thread per day. Retains why certain priorities were set, what trade-offs were discussed.

**Mastra storage keys:**
- `planner:today_date` — detect day rollover
- `planner:goal_count` — quick stat for dashboard
- `planner:completion_rate` — percentage completed today

**Tools:**

| Tool | Description |
|---|---|
| `readDayPlan()` | Reads and parses `~/.streams/day-plan.md` into structured goals |
| `writeDayPlan(content)` | Writes the full day plan to `~/.streams/day-plan.md` |
| `toggleGoal(goalId)` | Marks a goal as done/undone |
| `addGoal(description, priority?)` | Appends a new goal |
| `removeGoal(goalId)` | Removes a goal |
| `reorderGoals(goalIds[])` | Reorders goals by priority |
| `readStreamSummaries()` | Reads all active stream statuses to align plan with progress |
| `getCompletedStreams(date?)` | Lists streams completed today for debrief |
| `archiveDayPlan(date)` | Moves plan to `~/.streams/archive/plans/YYYY-MM-DD.md` |

**Key behaviours:**
- **Morning:** Reads yesterday's archived plan for carryover, reads active streams, proposes a structured day plan.
- **Mid-day:** Reads current plan + stream statuses, suggests highest-impact next action.
- **End-of-day:** Summarises accomplishments, carryovers. Writes archive. Asks about tomorrow.

---

### Agent 3: Stream Manager

**Role:** Core operational agent. Creates, monitors, updates, summarises, archives streams. Most tightly coupled to the filesystem and iTerm2 Claude Code sessions.

**Model:** `models.standard` (Maverick — needs reasoning for summaries and git context)

**Mastra memory:** Persistent thread (not daily). Retains knowledge across days — "last time you worked on RBAC, you were stuck on tenant isolation."

**Mastra storage keys:**
- `streams:active_count` — number of active streams
- `streams:last_scan` — timestamp of last filesystem scan
- `streams:alerts[]` — streams currently needing attention

**Tools:**

| Tool | Description |
|---|---|
| `listStreams(status?)` | Lists all streams, optionally filtered by status |
| `getStream(streamId)` | Returns full stream detail: metadata, recent events, scope summary |
| `createStream(name, worktreePath, description)` | Creates new stream directory with `stream.json` and empty `events.jsonl` |
| `updateStreamStatus(streamId, status)` | Updates status in `stream.json` |
| `appendEvent(streamId, event)` | Appends event to `events.jsonl` |
| `readScope(streamId)` | Reads the stream's `scope.md` |
| `writeScope(streamId, content)` | Writes/updates `scope.md` |
| `readNotes(streamId)` | Reads `notes.md` |
| `appendNote(streamId, note)` | Appends to `notes.md` with timestamp |
| `getStreamEvents(streamId, since?)` | Returns recent events, optionally since a timestamp |
| `summariseStream(streamId)` | Generates concise status summary from all stream data |
| `archiveStream(streamId)` | Moves stream from `active/` to `completed/` |
| `gitStatus(worktreePath)` | Runs `git status`, `git log --oneline -5`, `git branch` |
| `gitDiff(worktreePath)` | Returns summary of uncommitted changes |

---

### Agent 4: GitHub Monitor

**Role:** Watches GitHub activity. Surfaces PRs, issues, comments, review requests.

**Model:** `models.fast` (Scout — mostly fetching and formatting data)

**Mastra memory:** Minimal. One thread per day for deduplication.

**Mastra storage keys:**
- `github:last_poll` — timestamp of last poll
- `github:unread_count` — unread notifications count
- `github:watched_repos[]` — monitored repos (from config)
- `github:seen_notifications[]` — IDs already surfaced

**Tools:**

| Tool | Description |
|---|---|
| `pollNotifications()` | Fetches GitHub notifications via API, stores new ones |
| `listPRs(repo?, status?)` | Lists pull requests, optionally filtered |
| `getPRDetail(prUrl)` | Fetches detailed PR info |
| `listIssues(repo?, assignee?)` | Lists issues |
| `getIssueDetail(issueUrl)` | Fetches detailed issue info |
| `listReviewRequests()` | Lists PRs where user is requested reviewer |
| `markNotificationRead(notificationId)` | Marks notification as read |
| `getRepoActivity(repo, since?)` | Summarises recent repo activity |
| `readConfig()` | Reads GitHub config from `~/.streams/config.json` |

**Key behaviour:** The server-side GitHubPoller writes to `~/.streams/github/notifications.json` every 60 seconds. The agent reads from this file — it doesn't make API calls during conversation. The dashboard's GitHub panel reads the file directly via FileWatcher.

---

### Agent 5: Research & Ideas

**Role:** Creative and exploratory agent. Captures ideas, fleshes them out, maintains backlog, supports note-taking, and orchestrates autonomous idea exploration via Claude Code.

**Model:** `models.standard` (Maverick — needs good writing and reasoning)

**Mastra memory:** Persistent thread (not daily). Ideas evolve over weeks — "you mentioned this idea three days ago."

**Mastra storage keys:**
- `ideas:count` — total ideas
- `ideas:recent_tags[]` — recently used tags
- `ideas:last_reviewed` — when backlog was last reviewed

**Tools:**

| Tool | Description |
|---|---|
| `listIdeas(tag?, status?)` | Lists ideas from `~/.streams/ideas/` |
| `readIdea(ideaId)` | Reads a specific idea file |
| `createIdea(title, content, tags?)` | Creates new idea file |
| `updateIdea(ideaId, content)` | Updates an existing idea |
| `promoteToStream(ideaId)` | Converts idea to active stream (creates stream directory with idea as scope) |
| `archiveIdea(ideaId)` | Moves to `~/.streams/ideas/archive/` |
| `captureNote(content, context?)` | Quick capture to `~/.streams/notes/YYYY-MM-DD.md` |
| `readNotes(date?)` | Reads scratch notes for a day |
| `searchIdeas(query)` | Text search across all idea files |
| `tagIdea(ideaId, tags[])` | Adds/updates tags |
| `exploreLocally(ideaId, repoPath, focusAreas?)` | Spawns background Claude Code to explore idea |
| `exploreViaGitHub(ideaId, repo, labels?)` | Creates GitHub issue with exploration prompt |
| `getExplorationStatus(ideaId)` | Status of ongoing exploration |
| `readExplorationResults(ideaId)` | Reads exploration output |
| `cancelExploration(ideaId)` | Terminates running exploration |
| `answerExplorationQuestion(ideaId, answer)` | Pipes answer to paused exploration |
| `listActiveExplorations()` | Lists running explorations |

---

### Cross-Agent Communication

Agents never call each other directly. Communication happens through the filesystem:

- **"Plan my day"** → Day Planner reads stream statuses via `readStreamSummaries()` and GitHub notifications via `readFile()`. No agent-to-agent call needed.
- **"Promote idea X to a stream"** → Research & Ideas reads the idea. Coordinator then delegates stream creation to Stream Manager with the idea content.
- **"Debrief"** → Day Planner reads stream events, plan completion status, and GitHub activity from files. Single agent, multiple file reads.

### Mastra Memory Strategy

| Agent | Thread lifecycle | Purpose |
|---|---|---|
| Coordinator | One per day (reset each morning) | Day's conversational flow |
| Day Planner | One per day | Planning context and trade-offs |
| Stream Manager | Persistent (spans days) | Stream knowledge across sessions |
| GitHub Monitor | One per day | Deduplication context |
| Research & Ideas | Persistent (spans days) | Idea evolution over weeks |

Mastra working memory is used by the Coordinator to extract and maintain key facts: "user is focused on the RBAC stream", "user is blocked waiting on ops team."

---

## 7. Dashboard UI

The dashboard is the main event. It lives on a dedicated monitor, always open.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Topside                                      9:42 AM   │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │ RBAC v2 │ │ Bedrock │ │ Tiptap  │ │ PR      │      │
│  │ migrate │ │ SCP fix │ │ editor  │ │ reviews │      │
│  │         │ │         │ │         │ │         │      │
│  │ ●active │ │ ⚠input  │ │ ↻running│ │ ☑ done  │      │
│  │ 12m ago │ │ 3m ago  │ │ 1m ago  │ │ 8:50am  │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                         │
│  ┌──────────────────────┐ ┌──────────────────────────┐ │
│  │  Day Plan             │ │  GitHub                  │ │
│  │                       │ │                          │ │
│  │  ☑ Scope RBAC v2     │ │  PR #142 approved        │ │
│  │  ▶ Fix Bedrock SCP   │ │  Issue #89 comment       │ │
│  │  ☐ Tiptap spike      │ │  PR #138 merge conflict  │ │
│  │  ☐ Review 3 PRs      │ │                          │ │
│  └──────────────────────┘ └──────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Scoping / Ideas / Docs viewer                    │  │
│  │  (rendered markdown, tabbed by stream or idea)    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ▲ AI Assistant                             ─ ▢ × │  │
│  │  (collapsed by default, click to slide open)      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key UI Behaviours

**Stream cards:** Show name, status badge, last activity timestamp, worktree path. Clicking expands to show scoping doc, event timeline, git status. The "needs input" badge is visually prominent.

**Day plan:** Rendered from `day-plan.md`. Checkboxes are interactive (toggle calls the Day Planner agent's `toggleGoal` tool, which writes to the file, which the FileWatcher detects and broadcasts).

**GitHub panel:** Shows unread notifications. Each item links directly to GitHub (opens in browser).

**Document viewer:** Renders markdown with full GFM support. Tabbed — can show scoping docs, ideas, notes. Clicking a stream card's scope link opens it here.

**Ideas panel:** Browsable list of ideas from `~/.streams/ideas/`. Shows status badges (draft, exploring, explored). Explored ideas show a "View findings" link.

**Assistant drawer:**
- Collapsed by default. Shows a thin bar: "AI Assistant ▲"
- One click to expand to 40-50% of screen height
- Contains a clean chat interface — text input, message bubbles, agent responses with markdown rendering
- Collapses back with a click or keyboard shortcut (e.g., `Escape`)
- The Mastra agent session persists for the full day

### Navigation & Deep Linking

| Click target | Action |
|---|---|
| Stream card | Expand detail view with scope, events, git status |
| iTerm link on stream | Activate specific iTerm2 tab (via AppleScript + session ID) |
| GitHub item | Open in default browser |
| Day plan checkbox | Toggle goal completion |
| Idea | Open in document viewer |
| Exploration status | Show exploration results or pending question |

---

## 8. Server Layer

A single Express server handles everything.

### Responsibilities

1. **Static file serving:** Serves the React dashboard build (or proxies Vite in dev mode).
2. **WebSocket — file watching:** chokidar watches `~/.streams/` recursively. On any change, broadcasts the change type and path to connected clients. The dashboard updates the relevant panel.
3. **WebSocket — chat:** Receives user messages from the chat drawer. Routes through the Mastra agent runtime. Streams responses back.
4. **REST API — agent tools:** Some agent tools need HTTP endpoints (e.g., `gitStatus` executes shell commands, `pollNotifications` calls GitHub API). These are internal to the server.
5. **GitHubPoller:** Background interval that polls GitHub notifications API every 60 seconds, writes to `~/.streams/github/notifications.json`.
6. **ExplorationRunner:** Manages background Claude Code PTY sessions for autonomous idea exploration (see section 9).

### API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/chat` | WebSocket | Chat with the AI assistant |
| `/api/files` | WebSocket | Real-time file system updates |
| `/api/streams` | GET | List all streams (reads filesystem, no database) |
| `/api/streams/:id` | GET | Get stream detail |
| `/api/day-plan` | GET | Read current day plan |
| `/api/day-plan` | PUT | Update day plan (used by checkbox toggles) |
| `/api/ideas` | GET | List all ideas |
| `/api/ideas/:id` | GET | Get idea detail |
| `/api/github/notifications` | GET | Read cached notifications |
| `/api/iterm/activate/:sessionId` | POST | Activate iTerm2 tab via AppleScript |

Note: Most of these REST endpoints are convenience wrappers around file reads. The agents themselves use tool functions that read/write directly to the filesystem. The REST endpoints exist for the dashboard to fetch initial state on load.

---

## 9. Autonomous Idea Exploration

The Research & Ideas agent can dispatch Claude Code to autonomously explore ideas against the codebase. This is research, not implementation — Claude Code reads code, assesses feasibility, and writes findings.

### Mode 1: Local Exploration (Background Claude Code PTY)

**Flow:**

1. User asks: "Explore the webhook system idea against the platform repo"
2. Coordinator → Research & Ideas agent
3. Agent reads the idea file, gathers context (related streams, tech stack from config)
4. Agent crafts an exploration prompt and calls `exploreLocally()`
5. ExplorationRunner spawns a `claude` process via node-pty in the target repo directory
6. Claude Code runs autonomously — reads the codebase, writes findings to `~/.streams/ideas/{id}/exploration.md`
7. ExplorationRunner monitors output, writes events to `exploration-events.jsonl`
8. On completion: agent reads findings, summarises them, updates idea status
9. Dashboard shows notification: "Exploration complete"

**Exploration prompt template:**

```
You are exploring a technical idea for feasibility assessment. This is
research only — do not implement anything, do not create branches, do
not modify any files in the repository.

## Idea
{title and description from idea file}

## Context
- Repository: {repo path}
- Tech stack: {from config}
- Related work: {related streams or completed streams}
- Prior notes: {from idea file}

## Your mission
1. Read relevant parts of the codebase to understand current architecture
2. Assess feasibility given the existing codebase
3. Identify the recommended technical approach
4. List dependencies (libraries, services, infrastructure)
5. Identify risks or blockers
6. Estimate complexity (S/M/L/XL)
7. Note open questions that need human judgment

## Output
Write your complete findings to: ~/.streams/ideas/{idea-id}/exploration.md

Use this structure:
- Summary (2-3 sentences)
- Feasibility assessment
- Recommended approach
- Dependencies
- Risks and blockers
- Complexity estimate
- Open questions

If unsure about a decision, document your assumption and move on.
Do not ask for clarification unless absolutely necessary.
```

**Handling Claude Code questions (escalation strategy):**

1. **Pre-empt:** Front-load the prompt with enough context for autonomous operation.
2. **Escalate to user (V0):** If Claude Code asks a question, pause the exploration, write the question to events file, surface it in the dashboard. User responds, agent pipes the answer.
3. **Agent answers autonomously (V1):** Agent monitors PTY, formulates answers from its knowledge, pipes them back.

**Session management:**

- `max_concurrent: 1` — explorations don't compete with interactive iTerm sessions
- `timeout_minutes: 15` — prevents runaway sessions
- `priority: interactive_sessions_first` — checks active Claude Code process count before starting
- Queue holds pending explorations

### Mode 2: GitHub Issue Exploration (V1)

Creates a GitHub issue with a structured exploration prompt. Tagged to trigger Claude via GitHub integration. Results come back as issue comments, detected by the GitHub Monitor agent.

Best for: longer research, team-visible exploration, ideas that can wait.

### ExplorationRunner Service

Server-side service (not an agent) that manages the PTY lifecycle:

- **Spawn:** Start Claude Code via node-pty in a specified working directory
- **Prompt:** Pipe the initial exploration prompt
- **Monitor:** Watch output for completion signals, questions, errors
- **Events:** Write to `exploration-events.jsonl`
- **Timeout:** Kill sessions exceeding the limit
- **Queue:** Manage pending explorations when concurrency limit reached

---

## 10. Claude Code Hooks

Claude Code supports lifecycle hooks — scripts that execute on specific events. These bridge the iTerm2 sessions (where actual work happens) and the dashboard.

### Hook Events Used

| Event | Purpose | Writes to |
|---|---|---|
| Session start | Register session: working directory, git branch, terminal ID | `stream.json` (creates/updates) |
| Notification (needs input) | Alert that session is waiting for user | `events.jsonl` (appends `needs_input` event) |
| Task complete | Record completion | `events.jsonl` (appends `task_complete` event) |

### Hook Script Design

Each hook is a shell script that writes a JSON line to the correct stream's event file. The mapping between a Claude Code session and a stream is determined by matching `$PWD` to a stream's `worktree_path` in `stream.json`.

Example hook script (`~/.claude/hooks/on-notification.sh`):

```bash
#!/bin/bash
STREAMS_DIR="$HOME/.streams/active"
for stream_dir in "$STREAMS_DIR"/*/; do
  if [ -f "$stream_dir/stream.json" ]; then
    worktree=$(jq -r '.worktree_path' "$stream_dir/stream.json")
    if [ "$PWD" = "$worktree" ] || [[ "$PWD" == "$worktree"/* ]]; then
      echo "{\"type\":\"needs_input\",\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"message\":\"Claude Code needs input\"}" >> "$stream_dir/events.jsonl"
      # Update stream status
      jq '.status = "waiting" | .updated_at = now | todate' "$stream_dir/stream.json" > "$stream_dir/stream.json.tmp" && mv "$stream_dir/stream.json.tmp" "$stream_dir/stream.json"
      break
    fi
  fi
done
```

**Note:** Hook scripts are documented and provided but not auto-installed in V0. The user manually configures Claude Code hooks. V1 will include a setup script.

---

## 11. The Daily Workflow

### Morning

1. Open the dashboard on the second monitor. It's already running (or `npm run dev`).
2. Click the assistant drawer. Start a conversation: "Let's plan today. I need to finish the RBAC migration, the Bedrock SCP issue is still blocked, and I want to spike the Tiptap integration."
3. The Day Planner agent helps shape the plan, writes it to `day-plan.md`. The dashboard's day plan panel updates immediately.
4. Open iTerm2. Start Claude Code sessions in relevant worktrees. If hooks are configured, stream cards appear automatically.

### During the Day

5. Work happens in iTerm2 as normal. Each Claude Code session works on its scoped task.
6. The dashboard updates in real-time via file watching. Stream cards show activity, status changes, alerts.
7. Periodically check the dashboard. See what needs attention. Click an alert badge, switch to the right iTerm tab.
8. Use the assistant drawer when you need to think: "The RBAC scope is bigger than expected, should I split into two streams?" or "Summarise what's completed today."
9. Capture ideas as they surface: "Idea: webhook system for DottedFlow event notifications."
10. Dispatch explorations: "Explore the webhook idea against the platform repo" — Claude Code runs in the background while you continue working.
11. GitHub notifications appear in the feed. Handle them between streams.

### End of Day

12. Open the assistant drawer. "Debrief my day."
13. Day Planner reads all stream events, plan completion, and generates a summary.
14. Update the plan. Incomplete items carry over or get marked as blocked with context.
15. Archive completed streams.

---

## 12. Technical Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React 18+ with Vite | Dashboard UI |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Markdown rendering | react-markdown + remark-gfm | Scoping docs, day plan, ideas |
| Chat interface | Custom React component | Clean message bubbles with markdown rendering |
| Server | Express | HTTP, WebSocket, static serving |
| WebSocket | ws | Real-time file updates and chat streaming |
| File watching | chokidar | Monitors `~/.streams/` recursively |
| Agent framework | Mastra | Agent orchestration, memory, storage, tool calling |
| LLM provider (primary) | Groq (Llama 4 Scout + Maverick) | Fast, cheap inference for all agents |
| LLM provider (optional) | Anthropic (Claude Sonnet 4.6) | Complex analysis fallback |
| PTY management | node-pty | Background Claude Code for exploration |
| GitHub API | Octokit | Notification polling, PR/issue fetching |
| iTerm2 integration | osascript (AppleScript) | Tab activation via session ID |
| Package manager | npm | Monorepo with workspaces or single package |

### Project Structure

```
topside-dev/
├── package.json
├── tsconfig.json
├── .env                          # GROQ_API_KEY, ANTHROPIC_API_KEY (optional), GITHUB_TOKEN
│
├── server/
│   ├── index.ts                  # Express server entry point
│   ├── websocket.ts              # WebSocket setup (chat + file watching)
│   ├── file-watcher.ts           # chokidar watching ~/.streams/
│   ├── github-poller.ts          # Background GitHub notification polling
│   ├── exploration-runner.ts     # Background Claude Code PTY management
│   ├── routes/
│   │   ├── streams.ts            # /api/streams
│   │   ├── day-plan.ts           # /api/day-plan
│   │   ├── ideas.ts              # /api/ideas
│   │   ├── github.ts             # /api/github
│   │   └── iterm.ts              # /api/iterm
│   └── agents/
│       ├── index.ts              # Mastra setup, model config
│       ├── coordinator.ts        # Coordinator agent + tools
│       ├── day-planner.ts        # Day Planner agent + tools
│       ├── stream-manager.ts     # Stream Manager agent + tools
│       ├── github-monitor.ts     # GitHub Monitor agent + tools
│       └── research-ideas.ts     # Research & Ideas agent + tools
│
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx               # Main layout
│   │   ├── components/
│   │   │   ├── StreamCards.tsx    # Stream card grid
│   │   │   ├── StreamDetail.tsx  # Expanded stream view
│   │   │   ├── DayPlan.tsx       # Day plan with checkboxes
│   │   │   ├── GitHubFeed.tsx    # GitHub notifications panel
│   │   │   ├── DocViewer.tsx     # Markdown document viewer
│   │   │   ├── IdeasPanel.tsx    # Ideas list and viewer
│   │   │   ├── ChatDrawer.tsx    # Collapsible AI assistant
│   │   │   └── ChatMessage.tsx   # Individual chat message bubble
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts   # WebSocket connection hook
│   │   │   ├── useStreams.ts     # Stream state management
│   │   │   ├── useChat.ts        # Chat state and message handling
│   │   │   └── useDayPlan.ts     # Day plan state
│   │   └── lib/
│   │       └── api.ts            # REST API client
│   └── vite.config.ts
│
├── hooks/                        # Claude Code hook scripts (documented, manually installed)
│   ├── on-session-start.sh
│   ├── on-notification.sh
│   └── on-task-complete.sh
│
└── scripts/
    └── seed-data.ts              # Creates realistic ~/.streams/ structure for testing
```

---

## 13. Cost Model

### Groq (Primary — All Agents)

| Model | Input | Output | Use |
|---|---|---|---|
| Llama 4 Scout | $0.11 / M tokens | $0.34 / M tokens | Coordinator, GitHub Monitor |
| Llama 4 Maverick | $0.50 / M tokens | $0.77 / M tokens | Day Planner, Stream Manager, Research & Ideas |

### Estimated Daily Usage

| Scenario | Groq cost | Notes |
|---|---|---|
| Light day (30 interactions) | ~$0.01 | Mostly Scout routing |
| Normal day (50 interactions) | ~$0.05 | Mix of Scout and Maverick |
| Heavy day (80+ interactions) | ~$0.12 | Heavy Maverick usage |

### Monthly Estimate: $1 to $3

### Autonomous Exploration: $0

Runs on the user's Claude Code Max plan ($100/month subscription). No additional API cost.

### Claude API (Optional Fallback): Pay-per-use

Claude Sonnet 4.6 at $3/$15 per million tokens. Only used if explicitly triggered. Typical cost per deep-thinking interaction: $0.01-0.05. Not expected to be used daily.

---

## 14. V0 Implementation Scope

V0 must be usable within 1-2 days and prove whether the interaction model works.

### In Scope — V0

**Dashboard:**
- [ ] Main layout with stream cards, day plan panel, document viewer
- [ ] Collapsible AI assistant chat drawer at the bottom
- [ ] Stream cards showing name, status, last activity, worktree path
- [ ] Day plan rendered from `day-plan.md` with interactive checkboxes
- [ ] Scoping document viewer with proper markdown rendering
- [ ] Ideas section browsing `~/.streams/ideas/`
- [ ] Real-time updates via WebSocket + chokidar

**Server:**
- [ ] Express server with WebSocket (chat + file watching)
- [ ] chokidar watching `~/.streams/` with change broadcasting
- [ ] REST endpoints for initial data loading

**Agents (fully implemented):**
- [ ] Coordinator with routing logic and daily memory
- [ ] Day Planner with full planning lifecycle (read, write, toggle, archive)
- [ ] Stream Manager with create, list, status, summarise, archive, git status

**Agents (partially implemented):**
- [ ] Research & Ideas: idea creation, listing, note capture. No exploration.
- [ ] GitHub Monitor: read from pre-populated notifications file. No live polling.

**Infrastructure:**
- [ ] Seed data script creating realistic `~/.streams/` structure
- [ ] Single `npm run dev` command to start everything
- [ ] `.env` configuration for API keys

### Out of Scope — V0

- Autonomous exploration (ExplorationRunner + Claude Code PTY)
- GitHub live polling (server-side poller)
- iTerm2 deep linking (AppleScript)
- Claude Code hook scripts (documented format only)
- Stream creation from UI (use assistant chat instead)
- Day plan drag-and-drop reordering
- Idea promotion workflow
- Semantic search across ideas/notes
- Any persistence beyond the filesystem
- Mobile or remote access

---

## 15. V1 Roadmap

| Feature | Description |
|---|---|
| Autonomous exploration | ExplorationRunner with background Claude Code PTY sessions |
| GitHub live polling | Server-side Octokit poller writing to notifications.json |
| iTerm2 deep linking | Activate specific tab via AppleScript + session ID |
| Hook scripts | Installable Claude Code hooks with setup script |
| Idea promotion | Research & Ideas → Stream Manager handoff workflow |
| Day plan carryover | Automatic import of yesterday's incomplete items |
| Proactive alerts | Stream Manager surfaces idle/blocked streams |
| PR detail fetching | Full PR info on demand via GitHub API |
| GitHub issue exploration | Create issues tagged for Claude to investigate |

---

## 16. Open Questions

1. **Hook configuration.** How to make it easy to install Claude Code hooks in each session? A setup script? A shell alias wrapping `claude`?

2. **Stream-to-terminal mapping.** `$ITERM_SESSION_ID` — is it stable across terminal restarts? Does it survive iTerm2 being quit and reopened?

3. **Day plan format evolution.** Simple checkbox markdown works for V0. May need time estimates, priorities, dependencies later.

4. **Mastra storage backend.** Mastra supports SQLite, PostgreSQL, and in-memory storage. For a local single-user tool, SQLite (or even just a JSON file) is appropriate. Need to evaluate which Mastra storage adapter to use.

5. **Groq rate limits.** Groq's free tier allows 14,400 requests/day. Paid tier has higher limits. Need to confirm the paid tier limits are sufficient for heavy usage days.

6. **Stream status detection fallback.** If hooks aren't configured, streams appear stale. Should the dashboard fall back to reading git status from the worktree directly?

---

## 17. Seed Data Script

The seed data script (`scripts/seed-data.ts`) creates a realistic `~/.streams/` directory for immediate testing. It should create:

**Config:** `config.json` with placeholder GitHub token and example repo paths.

**Active streams (3):**
- `feat-rbac-v2` — status: active, with scope.md, several events, recent git activity
- `fix-bedrock-scp` — status: waiting (needs input), with events showing a blocking question
- `spike-tiptap-editor` — status: active, with a brief scope and recent start event

**Completed stream (1):**
- `setup-new-relic` — status: completed, with full event history

**Day plan:** A realistic `day-plan.md` with 5-6 goals, some checked off.

**Ideas (3):**
- `webhook-system.md` — detailed idea with open questions
- `nestd-booking-engine.md` — brief idea
- `contract-agent-v2.md` — brief idea

**Notes:** A couple of daily note files with realistic entries.

**GitHub notifications:** A pre-populated `github/notifications.json` with 4-5 realistic notifications (PRs, issues, comments).

This ensures the dashboard has meaningful content from the first `npm run dev`.

---

*This specification is ready for implementation. Start with the V0 scope: dashboard UI, server with file watching and chat WebSocket, Mastra agent setup with Coordinator, Day Planner, and Stream Manager fully implemented. The seed data script should be the first thing built so there's data to render immediately.*