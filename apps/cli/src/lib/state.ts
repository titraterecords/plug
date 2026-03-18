import { mkdir, readFile, writeFile } from "node:fs/promises";
import { CACHE_DIR, INSTALLED_PATH } from "./paths/cache.js";
import { chownToUser } from "./fix-permissions.js";

interface InstalledPlugin {
  version: string;
  formats: Record<string, string | string[]>; // format -> install path(s)
  installedAt: string;
}

type InstalledState = Record<string, InstalledPlugin>;

async function loadInstalled(): Promise<InstalledState> {
  try {
    const data = await readFile(INSTALLED_PATH, "utf-8");
    return JSON.parse(data) as InstalledState;
  } catch {
    return {};
  }
}

async function saveInstalled(state: InstalledState): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await chownToUser(CACHE_DIR);
  await writeFile(INSTALLED_PATH, JSON.stringify(state, null, 2));
  await chownToUser(INSTALLED_PATH);
}

async function markInstalled(
  id: string,
  version: string,
  format: string,
  paths: string[],
): Promise<void> {
  const state = await loadInstalled();
  if (!state[id]) {
    state[id] = { version, formats: {}, installedAt: new Date().toISOString() };
  }
  state[id].version = version;
  state[id].formats[format] = paths.length === 1 ? paths[0] : paths;
  await saveInstalled(state);
}

async function markUninstalled(id: string): Promise<void> {
  const state = await loadInstalled();
  delete state[id];
  await saveInstalled(state);
}

export { loadInstalled, markInstalled, markUninstalled, saveInstalled };
