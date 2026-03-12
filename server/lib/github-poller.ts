import { getGitHubConfig } from "./config.js";
import { getStreamsDir } from "./paths.js";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

let pollInterval: ReturnType<typeof setInterval> | null = null;

async function fetchNotifications(): Promise<void> {
  const config = await getGitHubConfig();
  if (!config.token) return;

  try {
    const response = await fetch("https://api.github.com/notifications", {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status}`);
      return;
    }

    let notifications = await response.json();

    // Filter to configured repos if any
    if (config.repos && config.repos.length > 0) {
      notifications = notifications.filter((n: any) =>
        config.repos!.includes(n.repository?.full_name)
      );
    }

    // Map to our GitHubNotification shape
    const mapped = notifications.map((n: any) => ({
      id: n.id,
      type: mapNotificationType(n.subject?.type),
      repo: n.repository?.full_name || "",
      title: n.subject?.title || "",
      url: n.subject?.url ? convertApiUrl(n.subject.url) : "",
      reason: n.reason || "",
      unread: n.unread,
      updated_at: n.updated_at,
    }));

    // Write to the existing cache file
    const githubDir = join(getStreamsDir(), "github");
    await mkdir(githubDir, { recursive: true });
    await writeFile(
      join(githubDir, "notifications.json"),
      JSON.stringify(mapped, null, 2)
    );
  } catch (error) {
    console.error("GitHub polling error:", error);
  }
}

function mapNotificationType(type?: string): string {
  switch (type) {
    case "PullRequest":
      return "pull_request";
    case "Issue":
      return "issue";
    case "Release":
      return "release";
    case "Discussion":
      return "discussion";
    case "CheckSuite":
      return "ci";
    case "Commit":
      return "commit";
    default:
      return type?.toLowerCase() || "unknown";
  }
}

function convertApiUrl(apiUrl: string): string {
  // Convert GitHub API URLs to web URLs
  // https://api.github.com/repos/owner/repo/pulls/123 -> https://github.com/owner/repo/pull/123
  return apiUrl
    .replace("https://api.github.com/repos/", "https://github.com/")
    .replace("/pulls/", "/pull/")
    .replace("/issues/", "/issues/");
}

export function startGitHubPoller(interval = 60000): void {
  // Fetch immediately on start
  fetchNotifications();

  pollInterval = setInterval(fetchNotifications, interval);
  console.log(`GitHub poller started (every ${interval / 1000}s)`);
}

export async function refreshGitHubNow(): Promise<void> {
  await fetchNotifications();
}

export function stopGitHubPoller(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
