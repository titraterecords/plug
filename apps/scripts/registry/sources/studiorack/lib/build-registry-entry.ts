import type { Platform, PluginFormat, Source } from "@titrate/registry-schema/schema";
import type { OasPackage, OasVersionEntry } from "./fetch-oas-registry.js";
import { findFileForPlatform } from "./find-file-for-platform.js";
import { slugToId } from "./slug-to-id.js";
import type { FoundArtifact } from "./scan-artifacts.js";

// Maps OAS "contains" values to our format names
const OAS_FORMAT_MAP: Record<string, PluginFormat> = {
  vst3: "vst3",
  component: "au",
  clap: "clap",
  lv2: "lv2",
};

// Maps OAS type values to our category names
const OAS_TYPE_MAP: Record<string, string> = {
  instrument: "synthesizer",
  effect: "effect",
  generator: "generator",
  sampler: "sampler",
  tool: "tool",
};

interface RegistryFormatEntry {
  url: string;
  sha256: string;
  artifact: string | string[];
}

interface RegistryVersionEntry {
  date?: string;
  source?: Source;
  formats: Record<string, Record<string, RegistryFormatEntry>>;
}

interface LocaleMeta {
  description: string;
  tags?: string[];
}

interface RegistryPlugin {
  id: string;
  name: string;
  author: string;
  description: string;
  version: string;
  license: string;
  category: string;
  tags: string[];
  meta?: Record<string, LocaleMeta>;
  homepage: string;
  versions: Record<string, RegistryVersionEntry>;
}

// Builds tags from OAS type + tags, normalized to lowercase.
// Includes "instrument" or "effect" as tags instead of a separate type field.
function buildTags(oasVersion: OasVersionEntry): string[] {
  const tags = new Set<string>();

  if (oasVersion.type) {
    tags.add(oasVersion.type.toLowerCase());
  }

  for (const tag of oasVersion.tags ?? []) {
    tags.add(tag.toLowerCase());
  }

  return [...tags];
}

// Builds a registry plugin entry from OAS data + scanned artifacts.
// The artifacts tell us the exact filenames inside the archive.
function buildRegistryEntry(
  pkg: OasPackage,
  platform: Platform,
  artifactsByVersion: Record<string, FoundArtifact[]>,
): RegistryPlugin | null {
  const latest = pkg.versions[pkg.version];
  if (!latest) return null;

  const id = slugToId(pkg.slug);

  const versions: Record<string, RegistryVersionEntry> = {};

  for (const [ver, versionData] of Object.entries(pkg.versions)) {
    const file = findFileForPlatform(versionData.files, platform);
    if (!file) continue;

    const artifacts = artifactsByVersion[ver] ?? [];
    if (artifacts.length === 0) continue;

    const formats: Record<string, Record<string, RegistryFormatEntry>> = {};

    // Group artifacts by format, then collapse single-element arrays to strings
    const byFormat = new Map<string, string[]>();

    for (const artifact of artifacts) {
      const oasFormat = Object.entries(OAS_FORMAT_MAP).find(
        ([, v]) => v === artifact.format,
      );
      if (!oasFormat) continue;
      const [oasKey] = oasFormat;

      if (!file.contains.includes(oasKey)) continue;

      const existing = byFormat.get(artifact.format) ?? [];
      existing.push(artifact.artifact);
      byFormat.set(artifact.format, existing);
    }

    for (const [format, names] of byFormat) {
      if (!formats[format]) {
        formats[format] = {};
      }
      formats[format][platform] = {
        url: file.url,
        sha256: file.sha256,
        artifact: names.length === 1 ? names[0] : names,
      };
    }

    if (Object.keys(formats).length === 0) continue;

    versions[ver] = {
      date: versionData.date?.split("T")[0],
      formats,
    };
  }

  if (Object.keys(versions).length === 0) return null;

  return {
    id,
    name: latest.name,
    author: latest.author,
    description: latest.description,
    version: pkg.version,
    license: latest.license,
    category: OAS_TYPE_MAP[latest.type] ?? latest.type,
    tags: buildTags(latest),
    homepage: latest.url,
    versions,
  };
}

export { buildRegistryEntry };
export type { RegistryPlugin };
