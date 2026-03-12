import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  readFile,
  writeFile,
  readdir,
  appendFile,
  mkdir,
} from "node:fs/promises";
import path from "node:path";
import { getStreamsDir } from "../../lib/paths.js";

/**
 * Simple YAML frontmatter parser. Expects:
 * ---
 * key: value
 * ---
 * body content
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatter: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      frontmatter[key] = value;
    }
  }
  return { frontmatter, body: match[2] };
}

function toFrontmatter(data: Record<string, string>, body: string): string {
  const yamlLines = Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${yamlLines}\n---\n${body}`;
}

export const listIdeas = createTool({
  id: "list-ideas",
  description:
    "Reads all .md files in ideas/ directory, parses YAML frontmatter, and returns an array of idea summaries",
  inputSchema: z.object({}),
  execute: async () => {
    const ideasDir = path.join(getStreamsDir(), "ideas");
    try {
      const files = await readdir(ideasDir);
      const ideas = [];

      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const content = await readFile(
          path.join(ideasDir, file),
          "utf-8",
        );
        const { frontmatter } = parseFrontmatter(content);
        ideas.push({
          id: file.replace(/\.md$/, ""),
          title: frontmatter.title ?? file,
          status: frontmatter.status ?? "draft",
          priority: frontmatter.priority ?? "normal",
        });
      }

      return { ideas };
    } catch {
      return { ideas: [] };
    }
  },
});

export const readIdea = createTool({
  id: "read-idea",
  description: "Reads a specific idea file from ideas/ directory",
  inputSchema: z.object({
    id: z.string().describe("Idea ID (filename without .md extension)"),
  }),
  execute: async ({ id }) => {
    const filePath = path.join(getStreamsDir(), "ideas", `${id}.md`);
    const content = await readFile(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);
    return { id, frontmatter, body };
  },
});

export const createIdea = createTool({
  id: "create-idea",
  description:
    "Creates a new idea .md file with YAML frontmatter in ideas/ directory",
  inputSchema: z.object({
    id: z.string().describe("Idea ID (used as filename)"),
    title: z.string().describe("Idea title"),
    status: z.string().describe("Status (e.g. draft, exploring, ready)"),
    priority: z.string().describe("Priority (e.g. low, normal, high)"),
    content: z.string().describe("Markdown body content"),
  }),
  execute: async ({ id, title, status, priority, content }) => {
    const ideasDir = path.join(getStreamsDir(), "ideas");
    await mkdir(ideasDir, { recursive: true });

    const fileContent = toFrontmatter(
      {
        title,
        status,
        priority,
        created: new Date().toISOString().split("T")[0],
      },
      content,
    );

    const filePath = path.join(ideasDir, `${id}.md`);
    await writeFile(filePath, fileContent, "utf-8");
    return { success: true, id };
  },
});

export const updateIdea = createTool({
  id: "update-idea",
  description: "Updates an existing idea file with new content",
  inputSchema: z.object({
    id: z.string().describe("Idea ID (filename without .md extension)"),
    content: z.string().describe("Full new content for the idea file"),
  }),
  execute: async ({ id, content }) => {
    const filePath = path.join(getStreamsDir(), "ideas", `${id}.md`);
    await writeFile(filePath, content, "utf-8");
    return { success: true, id };
  },
});

export const captureNote = createTool({
  id: "capture-note",
  description:
    "Appends a note to today's note file in notes/ directory (format: notes/YYYY-MM-DD.md)",
  inputSchema: z.object({
    content: z.string().describe("Note content to append"),
  }),
  execute: async ({ content }) => {
    const notesDir = path.join(getStreamsDir(), "notes");
    await mkdir(notesDir, { recursive: true });

    const date = new Date().toISOString().split("T")[0];
    const filePath = path.join(notesDir, `${date}.md`);

    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await appendFile(filePath, `\n**${timestamp}** — ${content}\n`, "utf-8");
    return { success: true, date, filePath };
  },
});

export const readNotes = createTool({
  id: "read-notes",
  description:
    "Reads notes for a specific date from notes/ directory. Defaults to today.",
  inputSchema: z.object({
    date: z
      .string()
      .optional()
      .describe("Date in YYYY-MM-DD format (defaults to today)"),
  }),
  execute: async ({ date }) => {
    const targetDate = date ?? new Date().toISOString().split("T")[0];
    const filePath = path.join(getStreamsDir(), "notes", `${targetDate}.md`);
    try {
      const content = await readFile(filePath, "utf-8");
      return { date: targetDate, content };
    } catch {
      return { date: targetDate, content: "", exists: false };
    }
  },
});
