import type { Platform } from "@titrate/registry-schema/schema";
import type { RegistryPlugin } from "../../studiorack/lib/build-registry-entry.js";
import type { FoundArtifact } from "../../studiorack/lib/scan-artifacts.js";
import type { RepoEntry } from "./load-repos.js";

interface VersionScanResult {
  version: string;
  date?: string;
  platform: Platform;
  url: string;
  sha256: string;
  artifacts: FoundArtifact[];
}

// Builds a registry plugin entry from GitHub release scan results.
// Metadata priority: repos.json overrides > existing registry data > defaults.
// This lets repos.json be minimal (just repo + id) for plugins that already
// have metadata from a StudioRack import.
function buildGithubEntry(
  repoEntry: RepoEntry,
  scans: VersionScanResult[],
  existing: RegistryPlugin | undefined,
): RegistryPlugin | null {
  if (scans.length === 0) return null;

  const versions: RegistryPlugin["versions"] = {};

  for (const scan of scans) {
    if (!versions[scan.version]) {
      versions[scan.version] = { date: scan.date, source: "github", formats: {} };
    }

    const formats = versions[scan.version].formats;
    for (const artifact of scan.artifacts) {
      if (!formats[artifact.format]) {
        formats[artifact.format] = {};
      }
      formats[artifact.format][scan.platform] = {
        url: scan.url,
        sha256: scan.sha256,
        artifact: artifact.artifact,
      };
    }
  }

  if (Object.keys(versions).length === 0) return null;

  // Pick the latest version string (first scan is from newest release)
  const latestVersion = scans[0].version;

  return {
    id: repoEntry.id,
    name: repoEntry.name ?? existing?.name ?? repoEntry.id,
    author: repoEntry.author ?? existing?.author ?? "",
    description: repoEntry.description ?? existing?.description ?? "",
    version: latestVersion,
    license: existing?.license ?? "",
    category: repoEntry.category ?? existing?.category ?? "effect",
    tags: repoEntry.tags ?? existing?.tags ?? [],
    homepage: existing?.homepage ?? `https://github.com/${repoEntry.repo}`,
    versions,
  };
}

export { buildGithubEntry };
export type { VersionScanResult };
