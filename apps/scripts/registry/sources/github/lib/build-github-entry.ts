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

    // Group artifacts by format, then collapse single-element arrays to strings
    const byFormat = new Map<string, string[]>();
    for (const artifact of scan.artifacts) {
      const existing = byFormat.get(artifact.format) ?? [];
      existing.push(artifact.artifact);
      byFormat.set(artifact.format, existing);
    }

    for (const [format, names] of byFormat) {
      if (!formats[format]) {
        formats[format] = {};
      }
      formats[format][scan.platform] = {
        url: scan.url,
        sha256: scan.sha256,
        artifact: names.length === 1 ? names[0] : names,
      };
    }
  }

  if (Object.keys(versions).length === 0) return null;

  // Pick the highest version by semver, not by release date.
  // Some repos publish patch releases for old branches after newer majors.
  const latestVersion = Object.keys(versions).sort((a, b) => {
    const pa = a.replace(/[^0-9.]/g, "").split(".").map(Number);
    const pb = b.replace(/[^0-9.]/g, "").split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  })[0];

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
