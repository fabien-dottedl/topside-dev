import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export async function parseStreamJson(filePath: string) {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function parseEventsJsonl(
  filePath: string,
): Promise<Array<{ type: string; timestamp: string; message: string }>> {
  try {
    const content = await readFile(filePath, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export async function parseIdeaFrontmatter(
  filePath: string,
): Promise<{
  id: string;
  title: string;
  status: string;
  priority: string;
  created: string;
  content: string;
} | null> {
  try {
    const raw = await readFile(filePath, "utf-8");
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return null;

    const frontmatter = match[1];
    const content = match[2].trim();

    const meta: Record<string, string> = {};
    for (const line of frontmatter.split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      // Strip surrounding quotes from YAML values
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }

    const id = path.basename(filePath, ".md");

    return {
      id,
      title: meta.title ?? "",
      status: meta.status ?? "",
      priority: meta.priority ?? "",
      created: meta.created ?? "",
      content,
    };
  } catch {
    return null;
  }
}

export async function readMarkdownFile(
  filePath: string,
): Promise<string | null> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}
