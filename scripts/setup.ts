/**
 * Topside Setup Script
 *
 * Creates ~/.streams/ directory structure and configures Claude Code hooks
 * so that Claude Code sessions are automatically tracked on the dashboard.
 *
 * Usage:
 *   pnpm setup
 *   pnpm setup --skip-hooks   # only create directories, don't configure hooks
 */

import { mkdir, readFile, writeFile, copyFile, chmod, access } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

const STREAMS_DIR = join(homedir(), ".streams");
const CLAUDE_SETTINGS_PATH = join(homedir(), ".claude", "settings.json");
const HOOKS_SOURCE_DIR = join(PROJECT_ROOT, "hooks");
const HOOKS_INSTALL_DIR = join(STREAMS_DIR, "hooks");

const skipHooks = process.argv.includes("--skip-hooks");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${msg}`);
}

function heading(msg: string) {
  console.log(`\n\x1b[1m${msg}\x1b[0m`);
}

function success(msg: string) {
  console.log(`\n\x1b[32m✓ ${msg}\x1b[0m`);
}

function warn(msg: string) {
  console.log(`\x1b[33m  ⚠ ${msg}\x1b[0m`);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// ─── Step 1: Create directory structure ──────────────────────────────────────

async function createDirectories() {
  heading("1. Creating ~/.streams/ directory structure");

  const dirs = [
    STREAMS_DIR,
    join(STREAMS_DIR, "active"),
    join(STREAMS_DIR, "completed"),
    join(STREAMS_DIR, "ideas"),
    join(STREAMS_DIR, "notes"),
    join(STREAMS_DIR, "archive", "plans"),
    join(STREAMS_DIR, "github"),
    join(STREAMS_DIR, "hooks"),
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
  }

  // Create config.json if it doesn't exist
  const configPath = join(STREAMS_DIR, "config.json");
  if (!(await exists(configPath))) {
    await writeFile(
      configPath,
      JSON.stringify(
        {
          github: { token: "" },
          repos: [],
        },
        null,
        2,
      ) + "\n",
    );
    log("created config.json");
  } else {
    log("config.json already exists, skipping");
  }

  // Create day-plan.md if it doesn't exist
  const dayPlanPath = join(STREAMS_DIR, "day-plan.md");
  if (!(await exists(dayPlanPath))) {
    const today = new Date().toISOString().split("T")[0];
    await writeFile(
      dayPlanPath,
      `# Day Plan — ${today}\n\n## Goals\n- [ ] \n\n## Notes\n`,
    );
    log("created day-plan.md");
  } else {
    log("day-plan.md already exists, skipping");
  }

  // Create empty notifications.json if it doesn't exist
  const notificationsPath = join(STREAMS_DIR, "github", "notifications.json");
  if (!(await exists(notificationsPath))) {
    await writeFile(notificationsPath, "[]\n");
    log("created github/notifications.json");
  }

  log("directories ready");
}

// ─── Step 2: Install hook scripts ────────────────────────────────────────────

async function installHooks() {
  heading("2. Installing hook scripts to ~/.streams/hooks/");

  const hookFiles = ["on-session-start.sh", "on-notification.sh", "on-stop.sh"];

  for (const file of hookFiles) {
    const src = join(HOOKS_SOURCE_DIR, file);
    const dest = join(HOOKS_INSTALL_DIR, file);
    await copyFile(src, dest);
    await chmod(dest, 0o755);
    log(`installed ${file}`);
  }
}

// ─── Step 3: Configure Claude Code ──────────────────────────────────────────

async function configureClaudeCode() {
  heading("3. Configuring Claude Code hooks");

  // Ensure ~/.claude/ exists
  await mkdir(dirname(CLAUDE_SETTINGS_PATH), { recursive: true });

  // Read existing settings
  let settings: Record<string, unknown> = {};
  if (await exists(CLAUDE_SETTINGS_PATH)) {
    try {
      const raw = await readFile(CLAUDE_SETTINGS_PATH, "utf-8");
      settings = JSON.parse(raw);
    } catch {
      warn("could not parse existing settings.json, backing up");
      await copyFile(
        CLAUDE_SETTINGS_PATH,
        CLAUDE_SETTINGS_PATH + ".backup",
      );
      settings = {};
    }
  }

  // Define hooks to add
  const topsideHooks = {
    SessionStart: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: `${HOOKS_INSTALL_DIR}/on-session-start.sh`,
            async: true,
          },
        ],
      },
    ],
    Notification: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: `${HOOKS_INSTALL_DIR}/on-notification.sh`,
            async: true,
          },
        ],
      },
    ],
    Stop: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: `${HOOKS_INSTALL_DIR}/on-stop.sh`,
            async: true,
          },
        ],
      },
    ],
  };

  // Merge hooks — preserve existing hooks, append Topside ones
  const existingHooks =
    (settings.hooks as Record<string, unknown[]>) || {};

  for (const [event, hookConfigs] of Object.entries(topsideHooks)) {
    const existing = (existingHooks[event] as unknown[]) || [];

    // Check if Topside hooks are already installed (avoid duplicates)
    const alreadyInstalled = existing.some((h: unknown) => {
      const hook = h as { hooks?: Array<{ command?: string }> };
      return hook.hooks?.some((inner) =>
        inner.command?.includes(".streams/hooks/"),
      );
    });

    if (alreadyInstalled) {
      log(`${event}: already configured, skipping`);
    } else {
      existingHooks[event] = [...existing, ...hookConfigs];
      log(`${event}: configured`);
    }
  }

  settings.hooks = existingHooks;

  // Write back
  await writeFile(
    CLAUDE_SETTINGS_PATH,
    JSON.stringify(settings, null, 2) + "\n",
  );
  log(`saved ${CLAUDE_SETTINGS_PATH}`);
}

// ─── Step 4: Create .env if needed ───────────────────────────────────────────

async function checkEnv() {
  heading("4. Checking environment");

  const envPath = join(PROJECT_ROOT, ".env");
  if (!(await exists(envPath))) {
    await copyFile(join(PROJECT_ROOT, ".env.example"), envPath);
    warn(".env created from .env.example — edit it to add your GROQ_API_KEY");
  } else {
    const content = await readFile(envPath, "utf-8");
    if (!content.includes("gsk_")) {
      warn("GROQ_API_KEY not set in .env — the chat assistant won't work without it");
      log("Get a key at https://console.groq.com → API Keys");
    } else {
      log("GROQ_API_KEY is set");
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\x1b[1mTopside Setup\x1b[0m");

  await createDirectories();

  if (!skipHooks) {
    await installHooks();
    await configureClaudeCode();
  } else {
    log("\nskipping hook installation (--skip-hooks)");
  }

  await checkEnv();

  success("Setup complete!\n");

  console.log("  Next steps:");
  console.log("  1. Add your Groq API key to .env (if not done)");
  console.log("     Get one at https://console.groq.com");
  console.log("  2. Start the dashboard:");
  console.log("     pnpm dev");
  console.log("  3. Open http://localhost:5173");
  console.log("");
  console.log("  Your Claude Code sessions will now automatically");
  console.log("  appear on the dashboard when working in a stream's worktree.");
  console.log("");
}

main().catch((err) => {
  console.error("\n\x1b[31mSetup failed:\x1b[0m", err.message);
  process.exit(1);
});
