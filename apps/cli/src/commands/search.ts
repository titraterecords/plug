import type { Command } from "commander";
import chalk from "chalk";
import type { Plugin } from "@titrate/registry-schema/schema";
import { currentPlatform } from "../lib/platform.js";
import { availableFormats, getRegistry, searchPlugins } from "../lib/registry.js";
import { dim } from "../lib/logger.js";

function formatPluginRow(plugin: Plugin): string {
  const platform = currentPlatform();
  const formats = availableFormats(plugin, platform).join(", ");
  return [
    chalk.bold(plugin.id.padEnd(24)),
    chalk.dim(plugin.version.padEnd(8)),
    plugin.description,
    chalk.dim(`[${formats}]`),
  ].join("  ");
}

function registerSearch(program: Command): void {
  program
    .command("search [query]")
    .description("Search for audio plugins")
    .option("-c, --category <category>", "Filter by category")
    .option("-f, --format <format>", "Filter by format (vst3, au, clap, lv2)")
    .option("--json", "Output as JSON")
    .action(
      async (
        query: string | undefined,
        options: { category?: string; format?: string; json?: boolean },
      ) => {
        const platform = currentPlatform();
        const registry = await getRegistry();
        const results = query
          ? searchPlugins(registry, query, {
              category: options.category,
              format: options.format,
              platform,
            })
          : registry.plugins;

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }

        if (results.length === 0) {
          dim(`No plugins found for "${query}"`);
          return;
        }

        for (const plugin of results) {
          console.log(formatPluginRow(plugin));
        }
      },
    );
}

export { registerSearch };
