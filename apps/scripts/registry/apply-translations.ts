// Applies cached translations to registry.json.
// Reads cache/translations.json and writes meta to each plugin.
// Run after build:registry to ensure translations survive rebuilds.
//
// Usage: pnpm apply-translations

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadRegistry } from "./sources/studiorack/lib/load-registry.js";
import { saveRegistry } from "./sources/studiorack/lib/save-registry.js";

const CACHE_PATH = join(import.meta.dirname, "cache/translations.json");

interface TranslatedEntry {
  description: string;
  tags: string[];
}

type TranslationsCache = Record<string, Record<string, TranslatedEntry>>;

async function main(): Promise<void> {
  let cache: TranslationsCache;
  try {
    const data = await readFile(CACHE_PATH, "utf-8");
    cache = JSON.parse(data) as TranslationsCache;
  } catch {
    console.log("No translations cache found. Run pnpm translate:registry first.");
    return;
  }

  const registry = await loadRegistry();
  let applied = 0;

  for (const plugin of registry.plugins) {
    const translations = cache[plugin.id];
    if (!translations) continue;

    // Build meta from cache, ensuring en uses the current root description
    plugin.meta = {
      en: {
        description: plugin.description,
        tags: plugin.tags ?? [],
      },
    };

    for (const [locale, entry] of Object.entries(translations)) {
      if (locale === "en") continue;
      plugin.meta[locale] = entry;
    }

    applied++;
  }

  if (applied === 0) {
    console.log("No translations to apply.");
    return;
  }

  await saveRegistry(registry);
  console.log(`Applied translations to ${applied} plugins`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
