import { Router } from "express";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { getStreamsDir } from "../lib/paths.js";
import { readMarkdownFile } from "../lib/parsers.js";

const router = Router();

// GET /api/notes?date=YYYY-MM-DD - return raw markdown content for a date
router.get("/", async (req, res) => {
  try {
    const date =
      typeof req.query.date === "string"
        ? req.query.date
        : new Date().toISOString().split("T")[0];
    const filePath = path.join(getStreamsDir(), "notes", `${date}.md`);
    const content = await readMarkdownFile(filePath);
    res.json({ date, content: content || "" });
  } catch {
    res.status(500).json({ error: "Failed to read notes" });
  }
});

// PUT /api/notes - write content for a date
router.put("/", async (req, res) => {
  try {
    const { date, content } = req.body;
    if (typeof date !== "string" || typeof content !== "string") {
      return res
        .status(400)
        .json({ error: "date and content must be strings" });
    }
    const notesDir = path.join(getStreamsDir(), "notes");
    await mkdir(notesDir, { recursive: true });
    const filePath = path.join(notesDir, `${date}.md`);
    await writeFile(filePath, content, "utf-8");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to save notes" });
  }
});

export default router;
