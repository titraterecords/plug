import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import {
  RegistrySchema,
  type Plugin,
  type Registry,
} from "@plug/registry-schema/schema";
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

interface SearchOptions {
  category?: string;
  format?: string;
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
      p.category.toLowerCase().includes(lower),
  );

  if (options.category) {
    const cat = options.category.toLowerCase();
    results = results.filter((p) => p.category.toLowerCase() === cat);
  }

  if (options.format) {
    results = results.filter((p) => options.format! in p.formats);
  }

  return results;
}

export { findPlugin, getRegistry, searchPlugins };
