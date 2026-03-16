import { writeFile } from "node:fs/promises";
import { CACHE_PATH, type HomepageCache } from "./load-homepage-cache.js";

async function saveHomepageCache(cache: HomepageCache): Promise<void> {
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

export { saveHomepageCache };
