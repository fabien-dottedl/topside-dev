import { Router } from "express";
import { readdir, readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { getStreamsDir } from "../lib/paths.js";
import { parseIdeaFrontmatter } from "../lib/parsers.js";

const router = Router();

// GET /api/ideas - list all ideas with parsed frontmatter
router.get("/", async (_req, res) => {
  try {
    const ideasDir = path.join(getStreamsDir(), "ideas");
    const entries = await readdir(ideasDir).catch(() => [] as string[]);
    const ideas = await Promise.all(
      (entries as string[])
        .filter((f) => f.endsWith(".md"))
        .map((f) => parseIdeaFrontmatter(path.join(ideasDir, f))),
    );
    res.json(ideas.filter(Boolean));
  } catch {
    res.json([]);
  }
});

// GET /api/ideas/:id - full idea content
router.get("/:id", async (req, res) => {
  const filePath = path.join(getStreamsDir(), "ideas", `${req.params.id}.md`);
  const idea = await parseIdeaFrontmatter(filePath);
  if (!idea) return res.status(404).json({ error: "Idea not found" });
  res.json(idea);
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function toFrontmatter(
  data: Record<string, string>,
  body: string,
): string {
  const yamlLines = Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${yamlLines}\n---\n${body}`;
}

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

// POST /api/ideas - create a new idea
router.post("/", async (req, res) => {
  try {
    const { title, status, priority, content } = req.body;
    if (typeof title !== "string" || typeof content !== "string") {
      return res
        .status(400)
        .json({ error: "title and content must be strings" });
    }

    const id = slugify(title);
    const ideasDir = path.join(getStreamsDir(), "ideas");
    await mkdir(ideasDir, { recursive: true });

    const fileContent = toFrontmatter(
      {
        title,
        status: status || "draft",
        priority: priority || "normal",
        created: new Date().toISOString().split("T")[0],
      },
      content,
    );

    const filePath = path.join(ideasDir, `${id}.md`);
    await writeFile(filePath, fileContent, "utf-8");
    res.json({ ok: true, id });
  } catch {
    res.status(500).json({ error: "Failed to create idea" });
  }
});

// PUT /api/ideas/:id - update an existing idea
router.put("/:id", async (req, res) => {
  try {
    const filePath = path.join(
      getStreamsDir(),
      "ideas",
      `${req.params.id}.md`,
    );
    const raw = await readFile(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(raw);

    const { title, status, priority, content } = req.body;
    if (title !== undefined) frontmatter.title = title;
    if (status !== undefined) frontmatter.status = status;
    if (priority !== undefined) frontmatter.priority = priority;

    const newBody = content !== undefined ? content : body;
    const fileContent = toFrontmatter(frontmatter, newBody);
    await writeFile(filePath, fileContent, "utf-8");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update idea" });
  }
});

// DELETE /api/ideas/:id - delete an idea
router.delete("/:id", async (req, res) => {
  try {
    const filePath = path.join(
      getStreamsDir(),
      "ideas",
      `${req.params.id}.md`,
    );
    await unlink(filePath);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete idea" });
  }
});

export default router;
