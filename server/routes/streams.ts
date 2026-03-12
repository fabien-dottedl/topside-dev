import { Router } from "express";
import { readdir, readFile, writeFile, rename, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { getStreamsDir } from "../lib/paths.js";
import {
  parseStreamJson,
  parseEventsJsonl,
  readMarkdownFile,
} from "../lib/parsers.js";

const router = Router();

// GET /api/streams - list active + completed streams
router.get("/", async (_req, res) => {
  try {
    const streamsDir = getStreamsDir();
    const active = await listStreamsInDir(path.join(streamsDir, "active"));
    const completed = await listStreamsInDir(path.join(streamsDir, "completed"));
    res.json({ active, completed });
  } catch (err) {
    res.status(500).json({ error: "Failed to list streams" });
  }
});

// GET /api/streams/:id - full stream detail
router.get("/:id", async (req, res) => {
  try {
    const streamsDir = getStreamsDir();
    const id = req.params.id;

    let streamDir = path.join(streamsDir, "active", id);
    let streamJson = await parseStreamJson(path.join(streamDir, "stream.json"));

    if (!streamJson) {
      streamDir = path.join(streamsDir, "completed", id);
      streamJson = await parseStreamJson(path.join(streamDir, "stream.json"));
    }

    if (!streamJson) {
      return res.status(404).json({ error: "Stream not found" });
    }

    const [events, scope, notes] = await Promise.all([
      parseEventsJsonl(path.join(streamDir, "events.jsonl")),
      readMarkdownFile(path.join(streamDir, "scope.md")),
      readMarkdownFile(path.join(streamDir, "notes.md")),
    ]);

    res.json({ ...streamJson, events, scope, notes });
  } catch (err) {
    res.status(500).json({ error: "Failed to get stream" });
  }
});

// PATCH /api/streams/:id/complete - move stream from active to completed
router.patch("/:id/complete", async (req, res) => {
  try {
    const streamsDir = getStreamsDir();
    const id = req.params.id;
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

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete stream" });
  }
});

// DELETE /api/streams/:id - delete stream directory
router.delete("/:id", async (req, res) => {
  try {
    const streamsDir = getStreamsDir();
    const id = req.params.id;

    // Remove from both active and completed (whichever exists)
    await rm(path.join(streamsDir, "active", id), { recursive: true, force: true });
    await rm(path.join(streamsDir, "completed", id), { recursive: true, force: true });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete stream" });
  }
});

// Helper to list all streams in a directory (reads each stream.json)
async function listStreamsInDir(dir: string) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const streams = await Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map(async (e) => {
          const streamJson = await parseStreamJson(
            path.join(dir, e.name, "stream.json"),
          );
          return streamJson;
        }),
    );
    return streams.filter(Boolean);
  } catch {
    return [];
  }
}

export default router;
