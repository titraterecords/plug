import type { Platform } from "@titrate/registry-schema/schema";
import type { RegistryPlugin } from "../../studiorack/lib/build-registry-entry.js";
import type { FoundArtifact } from "../../studiorack/lib/scan-artifacts.js";
import type { ManualPlugin } from "./load-manual-plugins.js";

interface PlatformScanResult {
  platform: Platform;
  url: string;
  sha256: string;
  artifacts: FoundArtifact[];
}

// Builds a registry plugin entry from manual plugin definition + scanned artifacts.
// Groups artifacts by format and platform to match the registry schema.
function buildManualEntry(
  plugin: ManualPlugin,
  scans: PlatformScanResult[],
): RegistryPlugin | null {
  const formats: Record<string, Record<string, { url: string; sha256: string; artifact: string | string[] }>> = {};

  // Group artifacts by format+platform, then collapse single-element arrays
  const grouped = new Map<string, Map<string, string[]>>();

  for (const scan of scans) {
    for (const artifact of scan.artifacts) {
      if (!grouped.has(artifact.format)) {
        grouped.set(artifact.format, new Map());
      }
      const platformMap = grouped.get(artifact.format)!;
      const existing = platformMap.get(scan.platform) ?? [];
      existing.push(artifact.artifact);
      platformMap.set(scan.platform, existing);
    }
  }

  for (const [format, platformMap] of grouped) {
    formats[format] = {};
    for (const [platform, names] of platformMap) {
      const scan = scans.find((s) => s.platform === platform)!;
      formats[format][platform] = {
        url: scan.url,
        sha256: scan.sha256,
        artifact: names.length === 1 ? names[0] : names,
      };
    }
  }

  if (Object.keys(formats).length === 0) return null;

  return {
    id: plugin.id,
    name: plugin.name,
    author: plugin.author,
    description: plugin.description,
    version: plugin.version,
    license: plugin.license,
    category: plugin.category,
    tags: plugin.tags,
    homepage: plugin.homepage,
    versions: {
      [plugin.version]: { formats },
    },
  };
}

export { buildManualEntry };
export type { PlatformScanResult };
