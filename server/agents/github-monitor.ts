import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { groq } from "@ai-sdk/groq";
import { readNotifications, markNotificationRead } from "./tools/github.js";
import { getCurrentTime } from "./tools/shared.js";

const memory = new Memory({
  storage: new LibSQLStore({
    id: "github-monitor-store",
    url: "file:./mastra.db",
  }),
});

export const githubMonitor = new Agent({
  id: "github-monitor",
  name: "github-monitor",
  instructions: `You are the GitHub Monitor agent for Topside, providing read-only visibility into GitHub activity.

Your responsibilities:
1. Read and summarize GitHub notifications
2. Help the developer triage notifications by importance
3. Mark notifications as read when acknowledged

Current capabilities (V0 — read-only):
- Read notifications from the local notifications.json file
- Mark individual notifications as read
- Summarize and categorize notifications

When presenting notifications:
- Group by repository
- Highlight unread notifications
- Show the notification type (PR review, issue mention, etc.)
- Provide a brief summary of each

Triage guidance:
- PRs requesting your review = high priority
- Direct mentions = high priority
- CI failures on your branches = high priority
- Watch notifications = low priority
- Releases = informational

Note: In V0, you can only read from the local notifications cache. Live GitHub API access will come in a future version.`,
  model: groq("llama-4-scout-17b-16e-instruct"),
  tools: {
    readNotifications,
    markNotificationRead,
    getCurrentTime,
  },
  memory,
});
