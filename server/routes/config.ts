import { Router } from "express";
import { readConfig, writeConfig, getGitHubConfig } from "../lib/config.js";
import { refreshGitHubNow } from "../lib/github-poller.js";

const router = Router();

// GET /api/config/github — return masked token + repos
router.get("/github", async (_req, res) => {
  try {
    const config = await getGitHubConfig();
    let maskedToken = "";
    if (config.token) {
      const last4 = config.token.slice(-4);
      maskedToken = `ghp_...${last4}`;
    }
    res.json({ token: maskedToken, repos: config.repos || [] });
  } catch {
    res.status(500).json({ error: "Failed to read config" });
  }
});

// PUT /api/config/github — update token and repos
router.put("/github", async (req, res) => {
  try {
    const { token, repos } = req.body;
    const config = await readConfig();
    const existing = config.github || {};

    // If token contains "..." it's the masked version — keep existing
    if (token !== undefined) {
      if (token.includes("...")) {
        // keep existing token
      } else {
        existing.token = token;
      }
    }

    if (repos !== undefined) {
      existing.repos = repos;
    }

    config.github = existing;
    await writeConfig(config);

    // Trigger an immediate poll with the new config
    refreshGitHubNow();

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to save config" });
  }
});

export default router;
