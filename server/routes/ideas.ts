import { Router } from "express";
import { readdir } from "node:fs/promises";
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

export default router;
