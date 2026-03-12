import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from "node:fs/promises";
import path from "node:path";
import { getStreamsDir } from "../../lib/paths.js";

export const readDayPlan = createTool({
  id: "read-day-plan",
  description: "Reads the current day-plan.md file from ~/.streams/day-plan.md",
  inputSchema: z.object({}),
  execute: async () => {
    const filePath = path.join(getStreamsDir(), "day-plan.md");
    try {
      const content = await readFile(filePath, "utf-8");
      return { content };
    } catch {
      return { content: "", exists: false };
    }
  },
});

export const writeDayPlan = createTool({
  id: "write-day-plan",
  description: "Writes full content to ~/.streams/day-plan.md",
  inputSchema: z.object({
    content: z.string().describe("Full markdown content for the day plan"),
  }),
  execute: async ({ content }) => {
    const filePath = path.join(getStreamsDir(), "day-plan.md");
    await writeFile(filePath, content, "utf-8");
    return { success: true };
  },
});

export const toggleGoal = createTool({
  id: "toggle-goal",
  description:
    "Toggles a checkbox in day-plan.md by matching the goal text. Switches [ ] to [x] or vice versa.",
  inputSchema: z.object({
    goal: z.string().describe("The goal text to find and toggle"),
  }),
  execute: async ({ goal }) => {
    const filePath = path.join(getStreamsDir(), "day-plan.md");
    let content = await readFile(filePath, "utf-8");

    const unchecked = `- [ ] ${goal}`;
    const checked = `- [x] ${goal}`;

    if (content.includes(unchecked)) {
      content = content.replace(unchecked, checked);
    } else if (content.includes(checked)) {
      content = content.replace(checked, unchecked);
    } else {
      return { success: false, error: `Goal not found: "${goal}"` };
    }

    await writeFile(filePath, content, "utf-8");
    return { success: true };
  },
});

export const addGoal = createTool({
  id: "add-goal",
  description: "Adds a new unchecked goal to day-plan.md",
  inputSchema: z.object({
    goal: z.string().describe("The goal text to add"),
  }),
  execute: async ({ goal }) => {
    const filePath = path.join(getStreamsDir(), "day-plan.md");
    let content: string;
    try {
      content = await readFile(filePath, "utf-8");
    } catch {
      content = "# Day Plan\n\n";
    }

    content = content.trimEnd() + `\n- [ ] ${goal}\n`;
    await writeFile(filePath, content, "utf-8");
    return { success: true };
  },
});

export const removeGoal = createTool({
  id: "remove-goal",
  description: "Removes a goal line from day-plan.md by matching the goal text",
  inputSchema: z.object({
    goal: z.string().describe("The goal text to remove"),
  }),
  execute: async ({ goal }) => {
    const filePath = path.join(getStreamsDir(), "day-plan.md");
    const content = await readFile(filePath, "utf-8");

    const lines = content.split("\n");
    const filtered = lines.filter(
      (line) =>
        !line.includes(`[ ] ${goal}`) && !line.includes(`[x] ${goal}`),
    );

    if (filtered.length === lines.length) {
      return { success: false, error: `Goal not found: "${goal}"` };
    }

    await writeFile(filePath, filtered.join("\n"), "utf-8");
    return { success: true };
  },
});

export const readStreamSummaries = createTool({
  id: "read-stream-summaries",
  description:
    "Reads all active stream.json files and returns summaries for planner context",
  inputSchema: z.object({}),
  execute: async () => {
    const activeDir = path.join(getStreamsDir(), "active");
    try {
      const entries = await readdir(activeDir, { withFileTypes: true });
      const summaries = [];

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const streamJsonPath = path.join(activeDir, entry.name, "stream.json");
        try {
          const raw = await readFile(streamJsonPath, "utf-8");
          const data = JSON.parse(raw);
          summaries.push({
            id: entry.name,
            title: data.title ?? entry.name,
            status: data.status ?? "unknown",
            repo: data.repo,
            branch: data.branch,
          });
        } catch {
          // skip streams without valid stream.json
        }
      }

      return { streams: summaries };
    } catch {
      return { streams: [] };
    }
  },
});

export const archiveDayPlan = createTool({
  id: "archive-day-plan",
  description:
    "Copies the current day-plan.md to archive/plans/{date}.md for archival",
  inputSchema: z.object({}),
  execute: async () => {
    const streamsDir = getStreamsDir();
    const sourcePath = path.join(streamsDir, "day-plan.md");
    const date = new Date().toISOString().split("T")[0];
    const archiveDir = path.join(streamsDir, "archive", "plans");
    await mkdir(archiveDir, { recursive: true });
    const destPath = path.join(archiveDir, `${date}.md`);
    await copyFile(sourcePath, destPath);
    return { success: true, archivedTo: destPath };
  },
});
