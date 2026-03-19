import { mkdir, readFile, writeFile } from "node:fs/promises";
import { CACHE_DIR, VERSION_CACHE_PATH } from "../constants.js";
import { chownToUser } from "./fix-permissions.js";

interface VersionCache {
  latest: string;
  checkedAt: number;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function loadVersionCache(): Promise<VersionCache | null> {
  try {
    const data = await readFile(VERSION_CACHE_PATH, "utf-8");
    return JSON.parse(data) as VersionCache;
  } catch {
    return null;
  }
}

async function checkForUpdate(currentVersion: string): Promise<string | null> {
  const cached = await loadVersionCache();
  if (cached && Date.now() - cached.checkedAt < ONE_DAY_MS) {
    return cached.latest !== currentVersion ? cached.latest : null;
  }

  try {
    const response = await fetch(
      "https://registry.npmjs.org/@titrate/plug/latest",
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { version: string };

    await mkdir(CACHE_DIR, { recursive: true });
    await chownToUser(CACHE_DIR);
    await writeFile(
      VERSION_CACHE_PATH,
      JSON.stringify({
        latest: data.version,
        checkedAt: Date.now(),
      }),
    );
    await chownToUser(VERSION_CACHE_PATH);

    return data.version !== currentVersion ? data.version : null;
  } catch {
    return null;
  }
}

export { checkForUpdate, loadVersionCache };
