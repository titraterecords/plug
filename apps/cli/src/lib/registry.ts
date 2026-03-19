import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import {
  RegistrySchema,
  type Platform,
  type Plugin,
  type PluginFormat,
  type Registry,
} from "@titrate/registry-schema/schema";
import { CACHE_DIR, REGISTRY_CACHE_PATH, REGISTRY_URL } from "../constants.js";
import { chownToUser } from "./fix-permissions.js";

const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

class RegistrySchemaError extends Error {
  constructor() {
    super("Registry format has changed.");
  }
}

function parseRegistry(data: unknown): Registry {
  const result = RegistrySchema.safeParse(data);
  if (result.success) return result.data;
  throw new RegistrySchemaError();
}

function selfUpdate(): never {
  const isStandalone = process.argv[1]?.includes(".plug/bin");
  const cmd = isStandalone
    ? "curl -fsSL plug.audio/install.sh | sh"
    : "npm install -g @titrate/plug@latest";

  console.log("\nplug needs to update to read the latest registry.\n");
  console.log(`Running: ${cmd}\n`);

  try {
    execSync(cmd, { stdio: "inherit" });
    console.log("\nUpdated. Please run your command again.");
  } catch {
    console.error(`\nAuto-update failed. Run manually: ${cmd}`);
  }
  process.exit(1);
}

async function fetchRegistry(): Promise<Registry> {
  const response = await fetch(REGISTRY_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch registry: ${response.status} ${response.statusText}`,
    );
  }
  return parseRegistry(await response.json());
}

async function cacheRegistry(registry: Registry): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await chownToUser(CACHE_DIR);
  await writeFile(REGISTRY_CACHE_PATH, JSON.stringify(registry, null, 2));
  await chownToUser(REGISTRY_CACHE_PATH);
}

async function loadCachedRegistry(): Promise<Registry | null> {
  try {
    const meta = await stat(REGISTRY_CACHE_PATH);
    const age = Date.now() - meta.mtimeMs;
    if (age > CACHE_MAX_AGE_MS) return null;

    const data = await readFile(REGISTRY_CACHE_PATH, "utf-8");
    return parseRegistry(JSON.parse(data));
  } catch {
    // Schema mismatch or corrupt cache - wipe it
    await rm(REGISTRY_CACHE_PATH, { force: true });
    return null;
  }
}

async function getRegistry(): Promise<Registry> {
  const cached = await loadCachedRegistry();
  if (cached) return cached;

  try {
    const registry = await fetchRegistry();
    await cacheRegistry(registry);
    return registry;
  } catch (err) {
    if (err instanceof RegistrySchemaError) selfUpdate();
    throw err;
  }
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

export { availableFormats, findPlugin, getRegistry };
