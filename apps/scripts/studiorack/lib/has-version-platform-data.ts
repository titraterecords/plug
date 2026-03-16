import type { Platform } from "@titrate/registry-schema/schema";
import type { RegistryPlugin } from "./build-registry-entry.js";

// Checks if a specific version of a plugin already has data for this platform.
// Used to skip individual version downloads - only fetch what's new.
function hasVersionPlatformData(
  existing: RegistryPlugin | undefined,
  platform: Platform,
  version: string,
): boolean {
  if (!existing) return false;

  const entry = existing.versions[version];
  if (!entry) return false;

  return Object.values(entry.formats).some(
    (platformMap) => platformMap && platform in platformMap,
  );
}

export { hasVersionPlatformData };
