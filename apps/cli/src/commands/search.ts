import type { Command } from "commander";
import chalk from "chalk";
import type { Plugin } from "@titrate/registry-schema/schema";
import { currentPlatform } from "../lib/platform.js";
import { availableFormats, getRegistry, searchPlugins } from "../lib/registry.js";
import { dim } from "../lib/logger.js";

function formatPluginRow(plugin: Plugin): string {
  const platform = currentPlatform();
  const formats = availableFormats(plugin, platform).join(", ");
  const line1 = `${chalk.bold(plugin.id)} ${chalk.dim(plugin.version)} ${chalk.dim(`[${formats}]`)}`;
  const line2 = `  ${plugin.description}`;
  return `${line1}\n${line2}`;
}

function registerSearch(program: Command): void {
  program
    .command("search [query]")
    .description("Search for audio plugins")
    .option("-c, --category <category>", "Filter by category")
    .option("-f, --format <format>", "Filter by format (vst3, au, clap, lv2)")
    .option("--json", "Output as JSON")
    .addHelpText("after", `
Examples:
  plug search reverb
  plug search --category synthesizer
  plug search --format au`)
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

        console.log();
        for (const plugin of results) {
          console.log(formatPluginRow(plugin));
          console.log();
        }
      },
    );
}

export { registerSearch };
