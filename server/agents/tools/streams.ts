import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  appendFile,
  rename,
} from "node:fs/promises";
import path from "node:path";
import { getStreamsDir } from "../../lib/paths.js";

export const listStreams = createTool({
  id: "list-streams",
  description:
    "Lists all streams from active/ and completed/ directories, reading each stream.json",
  inputSchema: z.object({}),
  execute: async () => {
    const streamsDir = getStreamsDir();
    const results: Array<{
      id: string;
      directory: string;
      title?: string;
      status?: string;
      repo?: string;
      branch?: string;
    }> = [];

    for (const dir of ["active", "completed"]) {
      const dirPath = path.join(streamsDir, dir);
      try {
        const entries = await readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const streamJsonPath = path.join(dirPath, entry.name, "stream.json");
          try {
            const raw = await readFile(streamJsonPath, "utf-8");
            const data = JSON.parse(raw);
            results.push({
              id: entry.name,
              directory: dir,
              title: data.title,
              status: data.status,
              repo: data.repo,
              branch: data.branch,
            });
          } catch {
            results.push({ id: entry.name, directory: dir });
          }
        }
      } catch {
        // directory doesn't exist yet
      }
    }

    return { streams: results };
  },
});

export const getStream = createTool({
  id: "get-stream",
  description:
    "Reads full stream detail including stream.json, events.jsonl, scope.md, and notes.md",
  inputSchema: z.object({
    id: z.string().describe("Stream ID (directory name)"),
  }),
  execute: async ({ id }) => {
    const streamsDir = getStreamsDir();
    // Check active first, then completed
    let streamDir = path.join(streamsDir, "active", id);
    let directory = "active";

    try {
      await readdir(streamDir);
    } catch {
      streamDir = path.join(streamsDir, "completed", id);
      directory = "completed";
    }

    const readOptional = async (filePath: string): Promise<string | null> => {
      try {
        return await readFile(filePath, "utf-8");
      } catch {
        return null;
      }
    };

    const streamJson = await readOptional(
      path.join(streamDir, "stream.json"),
    );
    const eventsRaw = await readOptional(
      path.join(streamDir, "events.jsonl"),
    );
    const scope = await readOptional(path.join(streamDir, "scope.md"));
    const notes = await readOptional(path.join(streamDir, "notes.md"));

    return {
      id,
      directory,
      stream: streamJson ? JSON.parse(streamJson) : null,
      events: eventsRaw
        ? eventsRaw
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line))
        : [],
      scope,
      notes,
    };
  },
});

export const createStream = createTool({
  id: "create-stream",
  description:
    "Creates a new stream directory in active/ with stream.json",
  inputSchema: z.object({
    id: z.string().describe("Stream ID (used as directory name)"),
    title: z.string().describe("Human-readable stream title"),
    repo: z.string().optional().describe("Git repository path"),
    branch: z.string().optional().describe("Git branch name"),
  }),
  execute: async ({ id, title, repo, branch }) => {
    const streamDir = path.join(getStreamsDir(), "active", id);
    await mkdir(streamDir, { recursive: true });

    const streamData = {
      id,
      title,
      status: "active",
      repo: repo ?? null,
      branch: branch ?? null,
      createdAt: new Date().toISOString(),
    };

    await writeFile(
      path.join(streamDir, "stream.json"),
      JSON.stringify(streamData, null, 2),
      "utf-8",
    );

    // Create empty companion files
    await writeFile(path.join(streamDir, "events.jsonl"), "", "utf-8");
    await writeFile(path.join(streamDir, "scope.md"), `# ${title}\n`, "utf-8");
    await writeFile(path.join(streamDir, "notes.md"), "", "utf-8");

    return { success: true, stream: streamData };
  },
});

export const updateStreamStatus = createTool({
  id: "update-stream-status",
  description: "Updates the status field in a stream's stream.json",
  inputSchema: z.object({
    id: z.string().describe("Stream ID"),
    status: z
      .string()
      .describe("New status value (e.g. active, paused, completed)"),
  }),
  execute: async ({ id, status }) => {
    const streamJsonPath = path.join(
      getStreamsDir(),
      "active",
      id,
      "stream.json",
    );
    const raw = await readFile(streamJsonPath, "utf-8");
    const data = JSON.parse(raw);
    data.status = status;
    data.updatedAt = new Date().toISOString();
    await writeFile(streamJsonPath, JSON.stringify(data, null, 2), "utf-8");
    return { success: true, stream: data };
  },
});

export const appendEvent = createTool({
  id: "append-event",
  description: "Appends a JSONL event line to a stream's events.jsonl",
  inputSchema: z.object({
    id: z.string().describe("Stream ID"),
    type: z.string().describe("Event type (e.g. note, status-change, commit)"),
    message: z.string().describe("Event message/description"),
  }),
  execute: async ({ id, type, message }) => {
    const eventsPath = path.join(
      getStreamsDir(),
      "active",
      id,
      "events.jsonl",
    );
    const event = {
      type,
      message,
      timestamp: new Date().toISOString(),
    };
    await appendFile(eventsPath, JSON.stringify(event) + "\n", "utf-8");
    return { success: true, event };
  },
});

export const readScope = createTool({
  id: "read-scope",
  description: "Reads scope.md for a stream",
  inputSchema: z.object({
    id: z.string().describe("Stream ID"),
  }),
  execute: async ({ id }) => {
    const streamsDir = getStreamsDir();
    // Try active first, then completed
    for (const dir of ["active", "completed"]) {
      const scopePath = path.join(streamsDir, dir, id, "scope.md");
      try {
        const content = await readFile(scopePath, "utf-8");
        return { content, directory: dir };
      } catch {
        // try next
      }
    }
    return { content: null, error: "scope.md not found" };
  },
});

export const writeScope = createTool({
  id: "write-scope",
  description: "Writes scope.md for a stream",
  inputSchema: z.object({
    id: z.string().describe("Stream ID"),
    content: z.string().describe("Full markdown content for scope.md"),
  }),
  execute: async ({ id, content }) => {
    const scopePath = path.join(
      getStreamsDir(),
      "active",
      id,
      "scope.md",
    );
    await writeFile(scopePath, content, "utf-8");
    return { success: true };
  },
});

export const appendNote = createTool({
  id: "append-note",
  description: "Appends text to a stream's notes.md",
  inputSchema: z.object({
    id: z.string().describe("Stream ID"),
    content: z.string().describe("Text content to append"),
  }),
  execute: async ({ id, content }) => {
    const notesPath = path.join(
      getStreamsDir(),
      "active",
      id,
      "notes.md",
    );
    await appendFile(notesPath, content + "\n", "utf-8");
    return { success: true };
  },
});

export const archiveStream = createTool({
  id: "archive-stream",
  description: "Moves a stream from active/ to completed/",
  inputSchema: z.object({
    id: z.string().describe("Stream ID to archive"),
  }),
  execute: async ({ id }) => {
    const streamsDir = getStreamsDir();
    const sourcePath = path.join(streamsDir, "active", id);
    const destPath = path.join(streamsDir, "completed", id);
    await mkdir(path.join(streamsDir, "completed"), { recursive: true });
    await rename(sourcePath, destPath);

    // Update status in stream.json
    const streamJsonPath = path.join(destPath, "stream.json");
    try {
      const raw = await readFile(streamJsonPath, "utf-8");
      const data = JSON.parse(raw);
      data.status = "completed";
      data.completedAt = new Date().toISOString();
      await writeFile(streamJsonPath, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // stream.json may not exist
    }

    return { success: true, movedTo: destPath };
  },
});
