import { writeFile } from "node:fs/promises";
import { HOMEPAGE_CACHE_PATH } from "./homepage-cache-path.js";
import type { HomepageCache } from "./load-homepage-cache.js";

async function saveHomepageCache(cache: HomepageCache): Promise<void> {
  await writeFile(HOMEPAGE_CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

export { saveHomepageCache };
