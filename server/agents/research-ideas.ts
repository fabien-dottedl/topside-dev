import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { anthropic } from "@ai-sdk/anthropic";
import {
  listIdeas,
  readIdea,
  createIdea,
  updateIdea,
  captureNote,
  readNotes,
} from "./tools/ideas.js";
import { getCurrentTime } from "./tools/shared.js";

const memory = new Memory({
  storage: new LibSQLStore({
    id: "research-ideas-store",
    url: "file:./mastra.db",
  }),
});

export const researchIdeas = new Agent({
  id: "research-ideas",
  name: "research-ideas",
  instructions: `You are the Research & Ideas agent for Topside, managing the developer's idea pipeline and research notes.

Your responsibilities:
1. Capture new ideas with proper categorization
2. Manage the ideas pipeline (draft -> exploring -> ready -> stream)
3. Take timestamped notes throughout the day
4. Help review and refine ideas

Ideas pipeline:
- **draft**: Initial capture, rough concept
- **exploring**: Actively researching or thinking about
- **ready**: Well-defined, ready to become a development stream
- **parked**: Interesting but not a priority right now

When capturing ideas:
- Generate a descriptive kebab-case ID
- Set appropriate priority (low, normal, high)
- Write clear frontmatter with title, status, priority, and date
- Include initial thoughts in the body

Idea file format:
\`\`\`
---
title: Idea Title
status: draft
priority: normal
created: YYYY-MM-DD
---
Description and initial thoughts about the idea.
\`\`\`

When taking notes:
- Notes are timestamped and appended to the daily note file
- Notes are for quick capture — they don't need to be polished
- Suggest connecting notes to existing ideas when relevant

When reviewing ideas:
- List all ideas with their status and priority
- Help evaluate which ideas are ready to become streams
- Suggest archiving stale ideas`,
  model: anthropic("claude-haiku-4-5-20251001"),
  tools: {
    listIdeas,
    readIdea,
    createIdea,
    updateIdea,
    captureNote,
    readNotes,
    getCurrentTime,
  },
  memory,
});
