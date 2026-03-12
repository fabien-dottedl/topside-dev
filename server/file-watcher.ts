import path from "node:path";
import { watch } from "chokidar";

export type FileChangeEvent = {
  type: "file-change";
  event: "add" | "change" | "unlink";
  path: string;
  category: "streams" | "day-plan" | "ideas" | "github" | "notes" | "config";
};

function categorize(
  relativePath: string
): FileChangeEvent["category"] {
  if (relativePath.includes("active/") || relativePath.includes("completed/")) {
    return "streams";
  }
  if (relativePath.includes("day-plan")) {
    return "day-plan";
  }
  if (relativePath.includes("ideas/")) {
    return "ideas";
  }
  if (relativePath.includes("github/")) {
    return "github";
  }
  if (relativePath.includes("notes/")) {
    return "notes";
  }
  return "config";
}

export function createFileWatcher(
  streamsDir: string,
  onChangeCallback: (event: FileChangeEvent) => void
) {
  const watcher = watch(streamsDir, {
    ignored: (filePath: string) => {
      const base = path.basename(filePath);
      return base.startsWith(".") || base === "node_modules";
    },
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
    },
  });

  const handle = (eventName: "add" | "change" | "unlink", filePath: string) => {
    const relativePath = path.relative(streamsDir, filePath);
    console.log(`[file-watcher] ${eventName}: ${relativePath} (${categorize(relativePath)})`);
    onChangeCallback({
      type: "file-change",
      event: eventName,
      path: relativePath,
      category: categorize(relativePath),
    });
  };

  watcher.on("ready", () => {
    console.log(`[file-watcher] Watching ${streamsDir} for changes`);
  });

  watcher.on("add", (p) => handle("add", p));
  watcher.on("change", (p) => handle("change", p));
  watcher.on("unlink", (p) => handle("unlink", p));

  return watcher;
}
