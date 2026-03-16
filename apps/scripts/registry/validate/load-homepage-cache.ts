import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CACHE_PATH = join(import.meta.dirname, "../cache/homepage-search-cache.json");

// Maps dead homepage URL -> search result.
// Prevents re-spending tokens on URLs we already searched for.
interface HomepageCacheEntry {
  found?: string;
  searchedAt: string;
}

type HomepageCache = Record<string, HomepageCacheEntry>;

async function loadHomepageCache(): Promise<HomepageCache> {
  try {
    const data = await readFile(CACHE_PATH, "utf-8");
    return JSON.parse(data) as HomepageCache;
  } catch {
    return {};
  }
}

export { loadHomepageCache, CACHE_PATH };
export type { HomepageCache, HomepageCacheEntry };
