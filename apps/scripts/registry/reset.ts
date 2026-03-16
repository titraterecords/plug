// Resets registry.json to an empty state for a fresh import.
// Used by build:registry:fresh to re-scan all plugins from scratch.

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const REGISTRY_PATH = join(import.meta.dirname, "../../../registry.json");

const empty = {
  version: "2",
  updated: new Date().toISOString().split("T")[0],
  plugins: [],
};

await writeFile(REGISTRY_PATH, JSON.stringify(empty, null, 2) + "\n");
console.log("Registry reset to empty state");
