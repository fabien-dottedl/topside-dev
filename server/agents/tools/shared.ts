import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readFile as fsReadFile } from "node:fs/promises";
import path from "node:path";
import { getStreamsDir } from "../../lib/paths.js";

export const readFile = createTool({
  id: "read-file",
  description:
    "Reads a file relative to the STREAMS_DIR (~/.streams). Returns the file content as a string.",
  inputSchema: z.object({
    path: z.string().describe("File path relative to STREAMS_DIR"),
  }),
  execute: async ({ path: filePath }) => {
    const fullPath = path.join(getStreamsDir(), filePath);
    const content = await fsReadFile(fullPath, "utf-8");
    return { content };
  },
});

export const getCurrentTime = createTool({
  id: "get-current-time",
  description:
    "Returns the current ISO timestamp and human-readable formatted date/time.",
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date();
    return {
      iso: now.toISOString(),
      date: now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  },
});

export const delegateToAgent = createTool({
  id: "delegate-to-agent",
  description:
    "Delegates a task to a specialist agent. Use this to route requests to: day-planner, stream-manager, github-monitor, or research-ideas.",
  inputSchema: z.object({
    agentName: z
      .string()
      .describe(
        "Name of the agent to delegate to: day-planner, stream-manager, github-monitor, or research-ideas",
      ),
    message: z.string().describe("The message/task to send to the agent"),
  }),
  execute: async ({ agentName, message }): Promise<{ response?: string; error?: string }> => {
    // Lazy import to avoid circular dependency
    const mod = await import("../index.js");
    const mastraInstance = mod.mastra;

    const validAgents = ["day-planner", "stream-manager", "github-monitor", "research-ideas"];

    if (!validAgents.includes(agentName)) {
      return {
        error: `Unknown agent: ${agentName}. Available agents: ${validAgents.join(", ")}`,
      };
    }

    const agent = mastraInstance.getAgent(agentName);
    const result = await agent.generate(message);
    return { response: result.text };
  },
});
