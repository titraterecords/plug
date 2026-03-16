import { writeFile } from "node:fs/promises";
import { REGISTRY_PATH, type RegistryJson } from "./load-registry.js";

async function saveRegistry(registry: RegistryJson): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  registry.updated = today;
  registry.plugins.sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
}

export { saveRegistry };
