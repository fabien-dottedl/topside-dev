import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStreamsDir } from "../../lib/paths.js";

export const readNotifications = createTool({
  id: "read-notifications",
  description:
    "Reads GitHub notifications from github/notifications.json in STREAMS_DIR",
  inputSchema: z.object({}),
  execute: async () => {
    const filePath = path.join(
      getStreamsDir(),
      "github",
      "notifications.json",
    );
    try {
      const raw = await readFile(filePath, "utf-8");
      const notifications = JSON.parse(raw);
      return { notifications };
    } catch {
      return { notifications: [] };
    }
  },
});

export const markNotificationRead = createTool({
  id: "mark-notification-read",
  description:
    "Marks a GitHub notification as read by setting unread=false in notifications.json",
  inputSchema: z.object({
    id: z.string().describe("Notification ID to mark as read"),
  }),
  execute: async ({ id }) => {
    const filePath = path.join(
      getStreamsDir(),
      "github",
      "notifications.json",
    );
    const raw = await readFile(filePath, "utf-8");
    const notifications = JSON.parse(raw);

    let found = false;
    for (const notification of notifications) {
      if (notification.id === id) {
        notification.unread = false;
        found = true;
        break;
      }
    }

    if (!found) {
      return { success: false, error: `Notification not found: ${id}` };
    }

    await writeFile(filePath, JSON.stringify(notifications, null, 2), "utf-8");
    return { success: true };
  },
});
