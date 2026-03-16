import { readFile } from "node:fs/promises";
import { HOMEPAGE_CACHE_PATH } from "./homepage-cache-path.js";

// Maps dead homepage URL -> search result.
// Prevents re-spending tokens on URLs we already searched for.
interface HomepageCacheEntry {
  found?: string;
  searchedAt: string;
}

type HomepageCache = Record<string, HomepageCacheEntry>;

async function loadHomepageCache(): Promise<HomepageCache> {
  try {
    const data = await readFile(HOMEPAGE_CACHE_PATH, "utf-8");
    return JSON.parse(data) as HomepageCache;
  } catch {
    return {};
  }
}

export { loadHomepageCache };
export type { HomepageCache, HomepageCacheEntry };
