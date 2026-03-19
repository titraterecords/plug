import type { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../lib/config.js";
import { error } from "../lib/logger.js";
import { currentPlatform } from "../lib/platform.js";
import { pluginDescription, pluginTags } from "../lib/plugin-meta.js";
import { availableFormats, findPlugin, getRegistry } from "../lib/registry.js";
import { loadInstalled } from "../lib/state.js";

function registerInfo(program: Command): void {
  program
    .command("info <name>")
    .description("Show plugin details")
    .option("--json", "Output as JSON")
    .addHelpText(
      "after",
      `
Examples:
  plug info ott
  plug info surge-xt`,
    )
    .action(async (name: string, options: { json?: boolean }) => {
      const platform = currentPlatform();
      const config = await loadConfig();
      const locale = config.language ?? "en";
      const registry = await getRegistry();
      const plugin = findPlugin(registry, name);

      if (!plugin) {
        error(`Plugin "${name}" not found.`);
        process.exit(1);
        return;
      }

      const installed = await loadInstalled();
      const installedEntry = installed[plugin.id];

      if (options.json) {
        console.log(
          JSON.stringify(
            { ...plugin, installed: installedEntry ?? null },
            null,
            2,
          ),
        );
        return;
      }

      const formats = availableFormats(plugin, platform);
      const versions = Object.keys(plugin.versions);
      const description = pluginDescription(plugin, locale);
      const tags = pluginTags(plugin, locale);

      console.log(chalk.bold(plugin.name));
      console.log(`  Description:  ${description}`);
      console.log(`  Version:      ${plugin.version}`);
      console.log(`  Versions:     ${versions.join(", ")}`);
      console.log(`  Formats:      ${formats.join(", ").toUpperCase()}`);
      console.log(`  Category:     ${plugin.category}`);
      if (tags.length > 0) {
        console.log(`  Tags:         ${tags.join(", ")}`);
      }
      console.log(`  License:      ${plugin.license}`);
      console.log(`  Homepage:     ${plugin.homepage}`);

      if (installedEntry) {
        const fmts = Object.entries(installedEntry.formats)
          .map(([fmt, p]) => {
            const paths = Array.isArray(p) ? p : [p];
            return paths
              .map((path) => `${fmt.toUpperCase()} -> ${path}`)
              .join(", ");
          })
          .join(", ");
        console.log(
          `  Installed:    ${chalk.green(installedEntry.version)} (${fmts})`,
        );
      } else {
        console.log(`  Installed:    ${chalk.dim("No")}`);
      }
    });
}

export { registerInfo };
