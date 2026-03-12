import { Router } from "express";
import { readdir } from "node:fs/promises";
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
