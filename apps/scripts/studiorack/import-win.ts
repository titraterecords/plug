// Imports Windows plugins from the Open Audio Stack registry.
// Only processes ZIP archives - exe installers are skipped because
// silent-installing arbitrary executables is not safe to automate.
// Skips individual versions that already have win data in the registry.
//
// Usage: pnpm import:win

import type { Platform } from "@titrate/registry-schema/schema";
import { fetchOasRegistry } from "./lib/fetch-oas-registry.js";
import { scanArtifactsFromUrl } from "./lib/scan-artifacts.js";
import { buildRegistryEntry, findFileForPlatform } from "./lib/build-registry-entry.js";
import { loadRegistry, mergePlugins, saveRegistry } from "./lib/merge-registry.js";
import { hasVersionPlatformData, loadIdOverrides, resolveId } from "./lib/should-skip.js";

const PLATFORM: Platform = "win";

function isSfzOnly(contains: string[]): boolean {
  return contains.every((c) => ["sfz", "sf2"].includes(c));
}

function isZipArchive(url: string, type: string): boolean {
  return type === "archive" || url.toLowerCase().endsWith(".zip");
}

async function main(): Promise<void> {
  console.log(`Fetching Open Audio Stack registry...`);
  const oasRegistry = await fetchOasRegistry();
  const slugs = Object.keys(oasRegistry);
  console.log(`Found ${slugs.length} packages in OAS registry`);

  const registry = await loadRegistry();
  const idOverrides = await loadIdOverrides();
  const existingById = new Map(registry.plugins.map((p) => [p.id, p]));

  const newPlugins = [];
  let skippedVersions = 0;
  let skippedPlugins = 0;
  let skippedExe = 0;

  for (const slug of slugs) {
    const pkg = oasRegistry[slug];
    const latest = pkg.versions[pkg.version];
    if (!latest) continue;

    const file = findFileForPlatform(latest.files, PLATFORM);
    if (!file) continue;
    if (isSfzOnly(file.contains)) continue;

    if (!isZipArchive(file.url, file.type)) {
      skippedExe++;
      continue;
    }

    const id = resolveId(slug, idOverrides);
    const existing = existingById.get(id);

    const artifactsByVersion: Record<string, Awaited<ReturnType<typeof scanArtifactsFromUrl>>> = {};
    let scannedAny = false;

    for (const [ver, versionData] of Object.entries(pkg.versions)) {
      const versionFile = findFileForPlatform(versionData.files, PLATFORM);
      if (!versionFile) continue;
      if (isSfzOnly(versionFile.contains)) continue;
      if (!isZipArchive(versionFile.url, versionFile.type)) continue;

      if (hasVersionPlatformData(existing, PLATFORM, ver)) {
        skippedVersions++;
        continue;
      }

      if (!scannedAny) {
        console.log(`\n${pkg.slug} (${pkg.version})`);
        scannedAny = true;
      }

      try {
        console.log(`  Scanning v${ver}...`);
        const { artifacts, sha256 } = await scanArtifactsFromUrl(versionFile.url);

        if (versionFile.sha256 && sha256 !== versionFile.sha256) {
          console.warn(`  Checksum mismatch for v${ver} - expected ${versionFile.sha256.slice(0, 12)}... got ${sha256.slice(0, 12)}...`);
          continue;
        }

        if (artifacts.length === 0) {
          console.log(`  No plugin artifacts found`);
          continue;
        }

        artifactsByVersion[ver] = artifacts;
        console.log(`  Found: ${artifacts.map((a) => a.artifact).join(", ")}`);
      } catch (err) {
        console.warn(
          `  Failed to scan: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (!scannedAny) {
      skippedPlugins++;
      continue;
    }

    const entry = buildRegistryEntry(pkg, PLATFORM, artifactsByVersion);
    if (entry) {
      newPlugins.push(entry);
    }
  }

  console.log(`\nMerging ${newPlugins.length} plugins into registry...`);
  const { merged, added, enriched } = mergePlugins(registry.plugins, newPlugins);

  registry.plugins = merged;
  await saveRegistry(registry);

  console.log(`\nDone.`);
  console.log(`  Skipped: ${skippedPlugins} plugins, ${skippedVersions} versions (already imported)`);
  console.log(`  Skipped: ${skippedExe} exe installers`);
  console.log(`  Added: ${added.length} new plugins`);
  console.log(`  Enriched: ${enriched.length} existing plugins with win data`);
  if (added.length > 0) {
    console.log(`  New: ${added.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
