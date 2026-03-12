import { Router } from "express";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { getStreamsDir } from "../lib/paths.js";
import { readMarkdownFile } from "../lib/parsers.js";

const router = Router();

// GET /api/day-plan - return raw markdown content
router.get("/", async (_req, res) => {
  try {
    const filePath = path.join(getStreamsDir(), "day-plan.md");
    const content = await readMarkdownFile(filePath);
    res.json({ content: content || "" });
  } catch {
    res.status(500).json({ error: "Failed to read day plan" });
  }
});

// PUT /api/day-plan - write content
router.put("/", async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({ error: "content must be a string" });
    }
    const filePath = path.join(getStreamsDir(), "day-plan.md");
    await writeFile(filePath, content, "utf-8");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to save day plan" });
  }
});

export default router;
