import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import {
  RegistrySchema,
  type Platform,
  type Plugin,
  type PluginFormat,
  type Registry,
} from "@titrate/registry-schema/schema";
import { CACHE_DIR, REGISTRY_CACHE_PATH, REGISTRY_URL } from "../constants.js";

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

async function fetchRegistry(): Promise<Registry> {
  const response = await fetch(REGISTRY_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch registry: ${response.status} ${response.statusText}`,
    );
  }
  const data = await response.json();
  return RegistrySchema.parse(data);
}

async function cacheRegistry(registry: Registry): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(REGISTRY_CACHE_PATH, JSON.stringify(registry, null, 2));
}

async function loadCachedRegistry(): Promise<Registry | null> {
  try {
    const meta = await stat(REGISTRY_CACHE_PATH);
    const age = Date.now() - meta.mtimeMs;
    if (age > CACHE_MAX_AGE_MS) return null;

    const data = await readFile(REGISTRY_CACHE_PATH, "utf-8");
    return RegistrySchema.parse(JSON.parse(data));
  } catch {
    return null;
  }
}

async function getRegistry(): Promise<Registry> {
  const cached = await loadCachedRegistry();
  if (cached) return cached;

  const registry = await fetchRegistry();
  await cacheRegistry(registry);
  return registry;
}

function findPlugin(registry: Registry, id: string): Plugin | undefined {
  return registry.plugins.find((p) => p.id === id);
}

// Returns formats that have a download available for this platform.
// A format like AU only exists on mac, so linux would filter it out.
function availableFormats(
  plugin: Plugin,
  platform: Platform,
  version?: string,
): PluginFormat[] {
  const v = version ?? plugin.version;
  const entry = plugin.versions[v];
  if (!entry) return [];

  return (Object.keys(entry.formats) as PluginFormat[]).filter(
    (fmt) => platform in (entry.formats[fmt] ?? {}),
  );
}

interface SearchOptions {
  category?: string;
  format?: string;
  platform?: Platform;
}

function searchPlugins(
  registry: Registry,
  query: string,
  options: SearchOptions = {},
): Plugin[] {
  const lower = query.toLowerCase();

  let results = registry.plugins.filter(
    (p) =>
      p.id.includes(lower) ||
      p.name.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      (p.tags ?? []).some((t) => t.toLowerCase().includes(lower)),
  );

  if (options.category) {
    const cat = options.category.toLowerCase();
    results = results.filter((p) => p.category.toLowerCase() === cat);
  }

  if (options.format && options.platform) {
    // With platform context, only show plugins that have this format for this OS
    const fmt = options.format as PluginFormat;
    results = results.filter((p) =>
      availableFormats(p, options.platform!).includes(fmt),
    );
  } else if (options.format) {
    // Without platform, check if the format exists on any platform
    const fmt = options.format as PluginFormat;
    results = results.filter((p) => {
      const entry = p.versions[p.version];
      return entry && fmt in entry.formats;
    });
  }

  return results;
}

export { availableFormats, findPlugin, getRegistry, searchPlugins };
