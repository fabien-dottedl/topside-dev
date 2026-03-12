import { Router } from "express";
import path from "node:path";
import { getStreamsDir } from "../lib/paths.js";
import { readFile } from "node:fs/promises";

const router = Router();

// GET /api/github/notifications
router.get("/notifications", async (_req, res) => {
  try {
    const filePath = path.join(getStreamsDir(), "github", "notifications.json");
    const content = await readFile(filePath, "utf-8");
    res.json(JSON.parse(content));
  } catch {
    res.json([]);
  }
});

export default router;
