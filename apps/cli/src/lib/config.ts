import { mkdir, readFile, writeFile } from "node:fs/promises";
import { CACHE_DIR, CONFIG_PATH } from "../constants.js";
import { chownToUser } from "./fix-permissions.js";

interface Config {
  language?: string;
}

async function loadConfig(): Promise<Config> {
  try {
    const data = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(data) as Config;
  } catch {
    return {};
  }
}

async function saveConfig(config: Config): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await chownToUser(CACHE_DIR);
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
  await chownToUser(CONFIG_PATH);
}

export { loadConfig, saveConfig };
export type { Config };
