import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Platform } from "@titrate/registry-schema/schema";
import type { RegistryPlugin } from "./build-registry-entry.js";

const CURATION_PATH = join(import.meta.dirname, "../../registry/curation.json");

interface Curation {
  idOverrides: Record<string, string>;
}

// Loads curation ID overrides so we can resolve OAS slugs to our final IDs
async function loadIdOverrides(): Promise<Map<string, string>> {
  try {
    const data = await readFile(CURATION_PATH, "utf-8");
    const curation = JSON.parse(data) as Curation;
    const map = new Map<string, string>();
    for (const [slug, id] of Object.entries(curation.idOverrides)) {
      map.set(slug, id);
    }
    return map;
  } catch {
    return new Map();
  }
}

// Resolves the final registry ID for an OAS slug, checking curation overrides first
function resolveId(slug: string, overrides: Map<string, string>): string {
  return overrides.get(slug) ?? slug.split("/").pop() ?? slug;
}

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

export { hasVersionPlatformData, loadIdOverrides, resolveId };
