// Imports plugins directly from GitHub releases.
// Downloads each platform asset, scans for plugin artifacts, computes sha256,
// and merges into registry.json with source: "github".
// Skips versions already in the registry.
//
// Usage: pnpm import:github

import { scanArtifactsFromUrl } from "../studiorack/lib/scan-artifacts.js";
import { loadRegistry } from "../studiorack/lib/load-registry.js";
import { mergePlugins } from "../studiorack/lib/merge-plugins.js";
import { saveRegistry } from "../studiorack/lib/save-registry.js";
import { hasVersionPlatformData } from "../studiorack/lib/has-version-platform-data.js";
import { loadRepos } from "./lib/load-repos.js";
import { fetchReleases } from "./lib/fetch-releases.js";
import { versionFromTag } from "./lib/version-from-tag.js";
import { matchPlatform } from "./lib/match-platform.js";
import { buildGithubEntry, type VersionScanResult } from "./lib/build-github-entry.js";

async function main(): Promise<void> {
  const repos = await loadRepos();
  console.log(`Loaded ${repos.length} GitHub repos`);

  const registry = await loadRegistry();
  const existingById = new Map(registry.plugins.map((p) => [p.id, p]));

  const newPlugins = [];
  let skippedVersions = 0;

  for (const repoEntry of repos) {
    console.log(`\n${repoEntry.repo} (${repoEntry.id})`);

    let releases;
    try {
      releases = fetchReleases(repoEntry.repo);
    } catch (err) {
      console.warn(`  Failed to fetch releases: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    if (releases.length === 0) {
      console.log("  No releases found");
      continue;
    }

    console.log(`  ${releases.length} release(s)`);
    const existing = existingById.get(repoEntry.id);
    const scans: VersionScanResult[] = [];

    for (const release of releases) {
      const version = versionFromTag(release.tag_name, release.published_at);
      const date = release.published_at.split("T")[0];
      const platformAssets = new Map<string, { name: string; url: string }>();

      for (const asset of release.assets) {
        const platform = matchPlatform(asset.name);
        if (!platform) continue;

        // Keep the first match per platform per release
        if (!platformAssets.has(platform)) {
          platformAssets.set(platform, {
            name: asset.name,
            url: asset.browser_download_url,
          });
        }
      }

      if (platformAssets.size === 0) continue;

      for (const [platform, asset] of platformAssets) {
        if (hasVersionPlatformData(existing, platform as "mac" | "win" | "linux", version)) {
          skippedVersions++;
          continue;
        }

        try {
          console.log(`  ${release.tag_name} [${platform}] ${asset.name}`);
          const { artifacts, sha256 } = await scanArtifactsFromUrl(asset.url);

          if (artifacts.length === 0) {
            console.log("    No plugin artifacts found");
            continue;
          }

          console.log(`    Found: ${artifacts.map((a) => a.artifact).join(", ")}`);
          scans.push({
            version,
            date,
            platform: platform as "mac" | "win" | "linux",
            url: asset.url,
            sha256,
            artifacts,
          });
        } catch (err) {
          console.warn(`    Failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    const entry = buildGithubEntry(repoEntry, scans, existing);
    if (entry) {
      newPlugins.push(entry);
    }
  }

  console.log(`\nMerging ${newPlugins.length} plugin(s) into registry...`);
  const { merged, added, enriched } = mergePlugins(registry.plugins, newPlugins);

  registry.plugins = merged;
  await saveRegistry(registry);

  console.log(`\nDone.`);
  console.log(`  Skipped: ${skippedVersions} version/platform pairs (already imported)`);
  console.log(`  Added: ${added.length} new plugin(s)`);
  console.log(`  Enriched: ${enriched.length} existing plugin(s)`);
  if (added.length > 0) {
    console.log(`  New: ${added.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
