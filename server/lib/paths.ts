import { homedir } from "node:os";
import path from "node:path";

export function getStreamsDir(): string {
  const envDir = process.env.STREAMS_DIR;
  if (envDir) {
    return envDir.startsWith("~") ? envDir.replace("~", homedir()) : envDir;
  }
  return path.join(homedir(), ".streams");
}
