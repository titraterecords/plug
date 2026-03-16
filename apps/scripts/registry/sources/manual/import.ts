// Imports manually-curated plugins from plugins.json.
// Downloads each platform archive, computes sha256, scans for plugin
// artifacts, and merges verified entries into registry.json.
// Falls back to declared artifact names when scan can't extract
// (e.g. Windows exe installers).
//
// Usage: pnpm import:manual

import type { Platform } from "@titrate/registry-schema/schema";
import { scanArtifactsFromUrl } from "../studiorack/lib/scan-artifacts.js";
import { loadRegistry } from "../studiorack/lib/load-registry.js";
import { mergeManualPlugins } from "./lib/merge-manual-plugins.js";
import { saveRegistry } from "../studiorack/lib/save-registry.js";
import { loadManualPlugins } from "./lib/load-manual-plugins.js";
import { buildManualEntry, type PlatformScanResult } from "./lib/build-manual-entry.js";
import { artifactsFromNames } from "./lib/artifacts-from-names.js";
import { computeSha256FromUrl } from "./lib/compute-sha256-from-url.js";

async function main(): Promise<void> {
  const plugins = await loadManualPlugins();
  console.log(`Loaded ${plugins.length} manual plugin(s)`);

  const registry = await loadRegistry();
  const newPlugins = [];

  for (const plugin of plugins) {
    console.log(`\n${plugin.name} (${plugin.version})`);

    const scans: PlatformScanResult[] = [];
    const platforms = Object.entries(plugin.downloads) as [Platform, { url: string; artifacts: string[] }][];

    for (const [platform, download] of platforms) {
      try {
        console.log(`  Downloading ${platform}: ${download.url}`);
        const { artifacts, sha256 } = await scanArtifactsFromUrl(download.url);

        const resolved = artifacts.length > 0
          ? artifacts
          : artifactsFromNames(download.artifacts);

        if (resolved.length === 0) {
          console.log(`  No plugin artifacts found for ${platform}`);
          continue;
        }

        const source = artifacts.length > 0 ? "scanned" : "declared";
        console.log(`  sha256: ${sha256}`);
        console.log(`  Found (${source}): ${resolved.map((a) => a.artifact).join(", ")}`);
        scans.push({ platform, url: download.url, sha256, artifacts: resolved });
      } catch (err) {
        // Download failed - try computing sha256 separately if we have declared artifacts
        if (download.artifacts.length > 0) {
          const sha256 = await tryComputeSha256(download.url);
          if (sha256) {
            const resolved = artifactsFromNames(download.artifacts);
            console.log(`  sha256: ${sha256}`);
            console.log(`  Found (declared): ${resolved.map((a) => a.artifact).join(", ")}`);
            scans.push({ platform, url: download.url, sha256, artifacts: resolved });
            continue;
          }
        }
        console.warn(
          `  Failed to scan ${platform}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const entry = buildManualEntry(plugin, scans);
    if (entry) {
      newPlugins.push(entry);
    }
  }

  console.log(`\nMerging ${newPlugins.length} plugin(s) into registry...`);
  const { merged, added, updated } = mergeManualPlugins(registry.plugins, newPlugins);

  registry.plugins = merged;
  await saveRegistry(registry);

  console.log(`\nDone.`);
  console.log(`  Added: ${added.length} new plugin(s)`);
  console.log(`  Updated: ${updated.length} existing plugin(s)`);
  if (added.length > 0) {
    console.log(`  New: ${added.join(", ")}`);
  }
}

async function tryComputeSha256(url: string): Promise<string | null> {
  try {
    return await computeSha256FromUrl(url);
  } catch {
    return null;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
