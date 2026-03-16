import type { Command } from "commander";
import { rm } from "node:fs/promises";
import { REGISTRY_CACHE_PATH, VERSION_CACHE_PATH } from "../constants.js";

function registerClearCache(program: Command): void {
  program
    .command("clear-cache")
    .description("Clear cached registry and version data")
    .action(async () => {
      await rm(REGISTRY_CACHE_PATH, { force: true });
      await rm(VERSION_CACHE_PATH, { force: true });
      console.log("Cache cleared.");
    });
}

export { registerClearCache };
