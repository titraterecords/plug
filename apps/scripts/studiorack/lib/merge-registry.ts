import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RegistryPlugin } from "./build-registry-entry.js";

const REGISTRY_PATH = join(import.meta.dirname, "../../../../registry.json");

interface RegistryJson {
  version: string;
  updated: string;
  plugins: RegistryPlugin[];
}

// Reads the current registry.json from the repo root
async function loadRegistry(): Promise<RegistryJson> {
  const data = await readFile(REGISTRY_PATH, "utf-8");
  return JSON.parse(data) as RegistryJson;
}

// Merges new plugins into the registry, skipping any that already exist by id.
// For existing plugins, merges new platform entries into existing version format maps.
function mergePlugins(
  existing: RegistryPlugin[],
  incoming: RegistryPlugin[],
): { merged: RegistryPlugin[]; added: string[]; enriched: string[] } {
  const byId = new Map(existing.map((p) => [p.id, p]));
  const added: string[] = [];
  const enriched: string[] = [];

  for (const plugin of incoming) {
    const current = byId.get(plugin.id);

    if (!current) {
      byId.set(plugin.id, plugin);
      added.push(plugin.id);
      continue;
    }

    // Plugin exists - merge platform data into existing version entries
    let wasEnriched = false;
    for (const [ver, versionEntry] of Object.entries(plugin.versions)) {
      if (!current.versions[ver]) {
        current.versions[ver] = versionEntry;
        wasEnriched = true;
        continue;
      }

      // Version exists - merge format/platform entries
      for (const [fmt, platforms] of Object.entries(versionEntry.formats)) {
        if (!current.versions[ver].formats[fmt]) {
          current.versions[ver].formats[fmt] = platforms;
          wasEnriched = true;
          continue;
        }

        for (const [plat, entry] of Object.entries(platforms)) {
          if (!current.versions[ver].formats[fmt][plat]) {
            current.versions[ver].formats[fmt][plat] = entry;
            wasEnriched = true;
          }
        }
      }
    }

    if (wasEnriched) enriched.push(plugin.id);
  }

  return {
    merged: [...byId.values()],
    added,
    enriched,
  };
}

// Writes the updated registry back to disk
async function saveRegistry(registry: RegistryJson): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  registry.updated = today;
  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
}

export { loadRegistry, mergePlugins, saveRegistry };
