// Registry build pipeline
//
// The registry is assembled from multiple sources, curated, then validated.
// Each step writes to registry.json. Later steps stack on top of earlier ones.
//
// 1. IMPORT: STUDIORACK (sources/studiorack/)
//    Fetches the Open Audio Stack registry (CC0 licensed, ~100 plugins).
//    Downloads each archive, extracts it, scans for .vst3/.component/.clap/.lv2
//    artifacts. Writes entries with verified artifact names and sha256 hashes.
//    Runs per-platform: import:studiorack:mac, import:studiorack:linux, import:studiorack:win
//    Skips versions already in the registry (keyed by plugin ID + version + platform).
//
// 2. IMPORT: MANUAL (sources/manual/)
//    Hand-curated plugins not in OAS (Valhalla, Xfer, etc.).
//    Reads plugins.json, downloads archives, computes sha256, scans artifacts.
//    Overwrites existing entries for the same plugin - used to fix broken data
//    or add plugins from vendor sites that OAS doesn't cover.
//    Run: import:manual
//
// 3. BUILD (this file)
//    Applies curation from curation.json:
//    - Renames IDs (OAS slug "surge" -> our ID "surge-xt")
//    - Deduplicates entries that map to the same final ID (merges version data)
//    - Sets recommended flags
//    - Removes excluded plugins
//    - Sorts: recommended first, then alphabetical
//    Run: build:registry
//
// 4. VALIDATE (validate.ts)
//    Checks every URL in the registry:
//    - Download URLs: HEAD request, falls back to GET for signed CDN URLs.
//      404/unreachable entries get removed from the registry.
//    - Homepage URLs: HEAD/GET check. If broken, uses Claude Code CLI to
//      web search for the current URL. Results cached in cache/ to avoid
//      repeat searches.
//    Run: validate:registry
//
// Full pipeline:
//   pnpm import:studiorack:mac
//   pnpm import:studiorack:linux
//   pnpm import:studiorack:win
//   pnpm import:manual
//   pnpm build:registry
//   pnpm validate:registry
//
// Usage: pnpm build:registry

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RegistryPlugin } from "./sources/studiorack/lib/build-registry-entry.js";

const REGISTRY_PATH = join(import.meta.dirname, "../../../registry.json");
const CURATION_PATH = join(import.meta.dirname, "curation.json");

interface Curation {
  idOverrides: Record<string, string>;
  recommended: string[];
  exclude: string[];
}

// Extends the imported type with the optional recommended field set by curation
interface CuratedPlugin extends RegistryPlugin {
  recommended?: boolean;
}

interface RegistryJson {
  version: string;
  updated: string;
  plugins: CuratedPlugin[];
}

async function main(): Promise<void> {
  const registryData = await readFile(REGISTRY_PATH, "utf-8");
  const registry = JSON.parse(registryData) as RegistryJson;

  const curationData = await readFile(CURATION_PATH, "utf-8");
  const curation = JSON.parse(curationData) as Curation;

  // Build a reverse map: current import IDs -> curated IDs.
  // The idOverrides map is keyed by OAS slug, but after import the plugin
  // already has a derived ID. Build a lookup from the slug's last segment
  // (what slugToId produces) to the override.
  const idRenames = new Map<string, string>();
  for (const [slug, newId] of Object.entries(curation.idOverrides)) {
    const importedId = slug.split("/").pop()!;
    idRenames.set(importedId, newId);
  }

  const excludeSet = new Set(curation.exclude);
  const recommendedSet = new Set(curation.recommended);

  // Apply ID renames
  for (const plugin of registry.plugins) {
    const renamed = idRenames.get(plugin.id);
    if (renamed) {
      plugin.id = renamed;
    }
  }

  // Deduplicate - when a manual entry and an import end up with the same ID,
  // merge their version data. The first occurrence keeps its metadata.
  const byId = new Map<string, CuratedPlugin>();
  for (const plugin of registry.plugins) {
    const existing = byId.get(plugin.id);
    if (!existing) {
      byId.set(plugin.id, plugin);
      continue;
    }

    // Merge versions from duplicate into existing
    for (const [ver, entry] of Object.entries(plugin.versions)) {
      if (!existing.versions[ver]) {
        existing.versions[ver] = entry;
      } else {
        // Merge format/platform entries within the version
        const existingFormats = existing.versions[ver].formats;
        const incomingFormats = entry.formats;

        for (const [fmt, platforms] of Object.entries(incomingFormats)) {
          if (!existingFormats[fmt]) {
            existingFormats[fmt] = platforms;
          } else {
            Object.assign(existingFormats[fmt], platforms);
          }
        }
      }
    }
  }

  // Apply recommended flags and exclusions.
  // Clear all existing flags first so removed recommendations don't persist.
  const plugins = [...byId.values()]
    .filter((p) => !excludeSet.has(p.id))
    .map((p) => {
      delete p.recommended;
      if (recommendedSet.has(p.id)) {
        p.recommended = true;
      }
      return p;
    });

  // Sort: recommended first, then alphabetical
  plugins.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return a.id.localeCompare(b.id);
  });

  registry.plugins = plugins;
  registry.updated = new Date().toISOString().split("T")[0];

  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");

  const recommendedCount = plugins.filter((p) => p.recommended).length;
  console.log(`Built registry: ${plugins.length} plugins (${recommendedCount} recommended)`);

  // Show renames that were applied
  const renames = [...idRenames.entries()].filter(
    ([from, to]) => from !== to,
  );
  if (renames.length > 0) {
    console.log(`Renamed: ${renames.map(([f, t]) => `${f} -> ${t}`).join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
