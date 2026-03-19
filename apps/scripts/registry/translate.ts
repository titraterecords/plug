// Translates plugin descriptions and tags into all supported locales.
// Reads the current registry, compares against cached translations,
// and only translates what's new or missing.
//
// Uses Claude Code CLI with the user's subscription - no API key needed.
// Translations are stored in cache/translations.json, separate from
// registry.json. The build step applies them after assembly.
//
// Usage: pnpm translate:registry

import { execSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { loadRegistry } from "./sources/studiorack/lib/load-registry.js";

const LOCALES = ["de", "es", "fr", "it", "ja", "pt", "zh"] as const;
const BATCH_SIZE = 5;
const CACHE_PATH = join(import.meta.dirname, "cache/translations.json");

interface TranslatedEntry {
  description: string;
  tags: string[];
}

type PluginTranslations = Record<string, TranslatedEntry>;
type TranslationsCache = Record<string, PluginTranslations>;

async function loadTranslationsCache(): Promise<TranslationsCache> {
  try {
    const data = await readFile(CACHE_PATH, "utf-8");
    return JSON.parse(data) as TranslationsCache;
  } catch {
    return {};
  }
}

async function saveTranslationsCache(
  cache: TranslationsCache,
): Promise<void> {
  await mkdir(join(import.meta.dirname, "cache"), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

function translateBatch(
  plugins: Array<{ id: string; description: string; tags: string[] }>,
  locales: string[],
): Record<string, Record<string, TranslatedEntry>> {
  const input = plugins.map((p) => ({
    id: p.id,
    description: p.description,
    tags: p.tags,
  }));

  const prompt = `Translate these audio plugin descriptions and tags into these languages: ${locales.join(", ")}.

Rules:
- Keep technical terms untranslated: VST3, CLAP, LV2, AU, MIDI, MPE, DAW, FM, EQ, LFO, ADSR, BPM, dB, Hz, kHz
- Keep plugin names, brand names, and proper nouns untranslated
- Tags should be short (1-2 words), translated naturally

Input:
${JSON.stringify(input, null, 2)}

Return this exact JSON structure (one key per plugin, one key per locale):
{
  "plugin-id": {
    "de": { "description": "...", "tags": ["..."] },
    "es": { "description": "...", "tags": ["..."] }
  }
}`;

  const result = execSync(
    `claude --print --model haiku -p ${JSON.stringify(prompt)}`,
    { encoding: "utf-8", timeout: 180000, maxBuffer: 1024 * 1024 },
  ).trim();

  // Extract JSON from response (may be wrapped in markdown fences)
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  return JSON.parse(jsonMatch[0]);
}

async function main(): Promise<void> {
  const registry = await loadRegistry();
  const cache = await loadTranslationsCache();

  // Find plugins needing translation by checking the cache
  const needsTranslation = registry.plugins.filter((plugin) => {
    const cached = cache[plugin.id];
    if (!cached) return true;
    return LOCALES.some((locale) => !cached[locale]);
  });

  if (needsTranslation.length === 0) {
    console.log("All plugins are fully translated.");
    return;
  }

  console.log(`${needsTranslation.length} plugins need translation`);

  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(needsTranslation.length / BATCH_SIZE);

    const plugins = batch.map((p) => ({
      id: p.id,
      description: p.description,
      tags: p.tags ?? [],
    }));

    const missingLocales = [
      ...new Set(
        batch.flatMap((p) =>
          LOCALES.filter((l) => !cache[p.id]?.[l]),
        ),
      ),
    ];

    console.log(
      `Batch ${batchNum}/${totalBatches}: ${plugins.map((p) => p.id).join(", ")}`,
    );

    try {
      const results = translateBatch(plugins, missingLocales);

      for (const plugin of batch) {
        const translations = results[plugin.id];
        if (!translations) continue;

        if (!cache[plugin.id]) {
          cache[plugin.id] = {
            en: {
              description: plugin.description,
              tags: plugin.tags ?? [],
            },
          };
        }

        for (const [locale, entry] of Object.entries(translations)) {
          if (!cache[plugin.id][locale]) {
            cache[plugin.id][locale] = entry;
          }
        }
      }

      // Save after each batch so progress isn't lost
      await saveTranslationsCache(cache);
    } catch (err) {
      console.error(
        `Batch ${batchNum} failed: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`,
      );
    }
  }

  console.log(`Done. Translated ${needsTranslation.length} plugins`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
