import { readdir } from "node:fs/promises";

const PLUGIN_EXTENSIONS = [".vst3", ".component", ".clap", ".lv2"];

const EXTENSION_TO_FORMAT: Record<string, string> = {
  ".vst3": "vst3",
  ".component": "au",
  ".clap": "clap",
  ".lv2": "lv2",
};

interface FoundArtifact {
  format: string;
  artifact: string;
}

// Recursively scans a directory for plugin bundles by extension.
// Returns the artifact filename (e.g. "Surge XT.vst3") and its format.
async function findPluginArtifacts(dir: string): Promise<FoundArtifact[]> {
  const results: FoundArtifact[] = [];
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    for (const ext of PLUGIN_EXTENSIONS) {
      if (entry.name.endsWith(ext)) {
        const format = EXTENSION_TO_FORMAT[ext];
        results.push({ format, artifact: entry.name });
      }
    }
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.format}:${r.artifact}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { findPluginArtifacts };
export type { FoundArtifact };
