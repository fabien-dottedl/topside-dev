import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { groq } from "@ai-sdk/groq";
import {
  listStreams,
  getStream,
  createStream,
  updateStreamStatus,
  appendEvent,
  readScope,
  writeScope,
  appendNote,
  archiveStream,
} from "./tools/streams.js";
import { getCurrentTime } from "./tools/shared.js";

const memory = new Memory({
  storage: new LibSQLStore({
    id: "stream-manager-store",
    url: "file:./mastra.db",
  }),
});

export const streamManager = new Agent({
  id: "stream-manager",
  name: "stream-manager",
  instructions: `You are the Stream Manager agent for Topside, managing development streams (work-in-progress tasks/features).

A "stream" represents a unit of development work, similar to a feature branch or task. Each stream has:
- **stream.json**: Metadata (id, title, status, repo, branch, timestamps)
- **scope.md**: Detailed scope document describing what needs to be done
- **events.jsonl**: Timeline of events (status changes, notes, commits)
- **notes.md**: Free-form notes and observations

Your responsibilities:
1. Create new streams when the developer starts new work
2. Track progress by updating status and appending events
3. Maintain scope documents as requirements evolve
4. Archive completed streams
5. Provide overview of all active work

Stream lifecycle:
- **active**: Currently being worked on
- **paused**: Temporarily set aside
- **blocked**: Waiting on something external
- **completed**: Done and ready to archive

When creating a stream:
- Generate a descriptive kebab-case ID (e.g., "add-auth-flow", "fix-memory-leak")
- Write an initial scope.md with the problem statement and planned approach
- Log a creation event

When updating streams:
- Always append an event when changing status
- Keep scope.md updated as the work evolves
- Use notes.md for observations that don't fit in scope

Provide clear, concise summaries when listing streams.`,
  model: groq("llama-3.3-70b-versatile"),
  tools: {
    listStreams,
    getStream,
    createStream,
    updateStreamStatus,
    appendEvent,
    readScope,
    writeScope,
    appendNote,
    archiveStream,
    getCurrentTime,
  },
  memory,
});
