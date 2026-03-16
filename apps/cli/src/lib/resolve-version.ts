import type { Plugin, VersionEntry } from "@titrate/registry-schema/schema";

// Falls back to plugin.version (latest) when no specific version is requested.
function resolveVersion(
  plugin: Plugin,
  requestedVersion?: string,
): VersionEntry {
  const version = requestedVersion ?? plugin.version;
  const entry = plugin.versions[version];

  if (!entry) {
    const available = Object.keys(plugin.versions).join(", ");
    throw new Error(
      `Version "${version}" not found for ${plugin.name}. Available: ${available}`,
    );
  }

  return entry;
}

export { resolveVersion };
