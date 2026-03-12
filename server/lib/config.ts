import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { getStreamsDir } from "./paths.js";

interface GitHubConfig {
  token?: string;
  repos?: string[];
}

interface Config {
  github?: GitHubConfig;
}

export async function readConfig(): Promise<Config> {
  try {
    const configPath = join(getStreamsDir(), "config.json");
    const data = await readFile(configPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function writeConfig(config: Config): Promise<void> {
  const configPath = join(getStreamsDir(), "config.json");
  await writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function getGitHubConfig(): Promise<GitHubConfig> {
  const config = await readConfig();
  return config.github || {};
}
