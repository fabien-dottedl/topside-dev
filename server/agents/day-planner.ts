import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { anthropic } from "@ai-sdk/anthropic";
import {
  readDayPlan,
  writeDayPlan,
  toggleGoal,
  addGoal,
  removeGoal,
  readStreamSummaries,
  archiveDayPlan,
} from "./tools/day-plan.js";
import { getCurrentTime } from "./tools/shared.js";

const memory = new Memory({
  storage: new LibSQLStore({
    id: "day-planner-store",
    url: "file:./mastra.db",
  }),
});

export const dayPlanner = new Agent({
  id: "day-planner",
  name: "day-planner",
  instructions: `You are the Day Planner agent for Topside, a developer's personal operations system.

Your responsibilities:
- Manage the daily plan (day-plan.md) with goals and priorities
- Help the developer plan their day based on active development streams
- Track goal completion and progress throughout the day
- Archive completed day plans

When managing the day plan:
1. Always read the current plan first to understand existing goals
2. Use readStreamSummaries to understand active development context
3. Goals should be specific and achievable within the day
4. Use checkbox format: "- [ ] Goal text" for unchecked, "- [x] Goal text" for completed
5. When writing a full plan, include a date header and organize by priority

Format for day plans:
\`\`\`
# Day Plan — {date}

## Focus
{main focus for the day}

## Goals
- [ ] High priority goal
- [ ] Medium priority goal
- [ ] Lower priority goal

## Notes
{any relevant context}
\`\`\`

At the end of the day, offer to archive the plan before creating a new one.`,
  model: anthropic("claude-haiku-4-5-20251001"),
  tools: {
    readDayPlan,
    writeDayPlan,
    toggleGoal,
    addGoal,
    removeGoal,
    readStreamSummaries,
    archiveDayPlan,
    getCurrentTime,
  },
  memory,
});
