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
  const formats: Record<string, Record<string, { url: string; sha256: string; artifact: string }>> = {};

  for (const scan of scans) {
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
