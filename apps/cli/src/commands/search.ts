import { Option, type Command } from "commander";
import chalk from "chalk";
import type { Platform, Plugin } from "@titrate/registry-schema/schema";
import { loadConfig } from "../lib/config.js";
import { currentPlatform } from "../lib/platform.js";
import { pluginDescription } from "../lib/plugin-meta.js";
import {
  availableFormats,
  getRegistry,
} from "../lib/registry.js";
import { searchPlugins } from "../lib/search-plugins.js";
import { dim } from "../lib/logger.js";

function formatPluginRow(
  plugin: Plugin,
  platform: Platform,
  locale: string,
): string {
  const formats = availableFormats(plugin, platform).join(", ");
  const description = pluginDescription(plugin, locale);
  const line1 = `${chalk.bold(plugin.id)} ${chalk.dim(plugin.version)} ${chalk.dim(`[${formats}]`)}`;
  const line2 = `  ${description}`;
  return `${line1}\n${line2}`;
}

function registerSearch(program: Command): void {
  program
    .command("search [query]")
    .description("Search for audio plugins")
    .option("-c, --category <category>", "Filter by category")
    .option("-f, --format <format>", "Filter by format (vst3, au, clap, lv2)")
    .option("--os <os>", "Filter by operating system (mac, win, linux)")
    .addOption(new Option("--platform <platform>").hideHelp())
    .option("--json", "Output as JSON")
    .addHelpText(
      "after",
      `
Examples:
  plug search reverb
  plug search --category synthesizer
  plug search --format au
  plug search --os win`,
    )
    .action(
      async (
        query: string | undefined,
        options: {
          category?: string;
          format?: string;
          os?: string;
          platform?: string;
          json?: boolean;
        },
      ) => {
        const osFlag = options.os ?? options.platform;
        const os = osFlag ? (osFlag as Platform) : currentPlatform();
        const config = await loadConfig();
        const locale = config.language ?? "en";
        const registry = await getRegistry();
        const results = searchPlugins(registry, query ?? "", {
          category: options.category,
          format: options.format,
          os,
        });

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }

        if (results.length === 0) {
          dim(`No plugins found for "${query}"`);
          return;
        }

        // Hide plugins with no formats on the target OS
        const visible = results.filter(
          (p) => availableFormats(p, os).length > 0,
        );

        if (visible.length === 0) {
          dim(
            query
              ? `No plugins found for "${query}" on ${os}`
              : `No plugins found for ${os}`,
          );
          return;
        }

        console.log();
        for (const plugin of visible) {
          console.log(formatPluginRow(plugin, os, locale));
          console.log();
        }
      },
    );
}

export { registerSearch };
