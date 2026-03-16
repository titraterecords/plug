import type { RegistryPlugin } from "../../studiorack/lib/build-registry-entry.js";

// Merges manual plugins into the registry, overwriting platform entries.
// Unlike the studiorack merge which preserves existing data, manual entries
// are authoritative - they replace existing platform data to fix issues
// like missing sha256 hashes.
function mergeManualPlugins(
  existing: RegistryPlugin[],
  incoming: RegistryPlugin[],
): { merged: RegistryPlugin[]; added: string[]; updated: string[] } {
  const byId = new Map(existing.map((p) => [p.id, p]));
  const added: string[] = [];
  const updated: string[] = [];

  for (const plugin of incoming) {
    const current = byId.get(plugin.id);

    if (!current) {
      byId.set(plugin.id, plugin);
      added.push(plugin.id);
      continue;
    }

    let wasUpdated = false;
    for (const [ver, versionEntry] of Object.entries(plugin.versions)) {
      if (!current.versions[ver]) {
        current.versions[ver] = versionEntry;
        wasUpdated = true;
        continue;
      }

      for (const [fmt, platforms] of Object.entries(versionEntry.formats)) {
        if (!current.versions[ver].formats[fmt]) {
          current.versions[ver].formats[fmt] = platforms;
          wasUpdated = true;
          continue;
        }

        // Overwrite platform entries unconditionally
        for (const [plat, entry] of Object.entries(platforms)) {
          current.versions[ver].formats[fmt][plat] = entry;
          wasUpdated = true;
        }
      }
    }

    if (wasUpdated) updated.push(plugin.id);
  }

  return {
    merged: [...byId.values()],
    added,
    updated,
  };
}

export { mergeManualPlugins };
