import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { RegistryPlugin } from "./build-registry-entry.js";

const REGISTRY_PATH = join(import.meta.dirname, "../../../../registry.json");

interface RegistryJson {
  version: string;
  updated: string;
  plugins: RegistryPlugin[];
}

async function loadRegistry(): Promise<RegistryJson> {
  const data = await readFile(REGISTRY_PATH, "utf-8");
  return JSON.parse(data) as RegistryJson;
}

export { loadRegistry, REGISTRY_PATH };
export type { RegistryJson };
