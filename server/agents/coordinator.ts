import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { groq } from "@ai-sdk/groq";
import { delegateToAgent, getCurrentTime } from "./tools/shared.js";

const memory = new Memory({
  storage: new LibSQLStore({
    id: "coordinator-store",
    url: "file:./mastra.db",
  }),
  options: {
    workingMemory: {
      enabled: true,
    },
  },
});

export const coordinator = new Agent({
  id: "coordinator",
  name: "coordinator",
  instructions: `You are Topside's coordinator agent. Your role is to route user requests to the appropriate specialist agent.

Available agents:
- **day-planner**: Daily planning, goals, and task management. Use for anything related to today's plan, goals, daily priorities, or time management.
- **stream-manager**: Development streams and work tracking. Use for creating/managing development tasks, work streams, scoping, and progress tracking.
- **github-monitor**: GitHub notifications and repository activity. Use for checking notifications, PR status, and GitHub-related queries.
- **research-ideas**: Ideas, notes, and research capture. Use for brainstorming, capturing ideas, taking notes, and research-related tasks.

Guidelines:
1. Analyze the user's intent and delegate to the right specialist agent using the delegateToAgent tool.
2. For general conversation or greetings, respond directly without delegating.
3. If the request spans multiple domains, delegate to the most relevant agent first.
4. Always pass along the full context of the user's request when delegating.
5. Present the specialist's response naturally — don't add unnecessary framing.`,
  model: groq("llama-4-scout-17b-16e-instruct"),
  tools: { delegateToAgent, getCurrentTime },
  memory,
});
