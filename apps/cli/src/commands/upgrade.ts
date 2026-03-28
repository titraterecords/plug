import type { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import type { PluginFormat } from "@titrate/registry-schema/schema";
import { pluginPaths, type InstallTarget } from "../lib/paths/plugin-paths.js";
import { verifyChecksum } from "../lib/checksum.js";
import { downloadFile } from "../lib/installer/download.js";
import { extractAndInstall } from "../lib/installer/install.js";
import { dim, error, success } from "../lib/logger.js";
import { currentPlatform } from "../lib/platform.js";
import { findPlugin, getRegistry } from "../lib/registry.js";
import { resolveVersion } from "../lib/resolve-version.js";
import { loadInstalled, markInstalled } from "../lib/state.js";

function registerUpgrade(program: Command): void {
  program
    .command("upgrade [name]")
    .description("Upgrade installed plugins")
    .option("-t, --target <target>", "Install target (user, system)", "user")
    .option("--json", "Output as JSON")
    .addHelpText(
      "after",
      `
Examples:
  plug upgrade
  plug upgrade ott`,
    )
    .action(
      async (
        name: string | undefined,
        options: { target: string; json?: boolean },
      ) => {
        const platform = currentPlatform();
        const registry = await getRegistry();
        const installed = await loadInstalled();
        const target = options.target as InstallTarget;
        const paths = pluginPaths(platform);

        const ids = name ? [name] : Object.keys(installed);

        if (ids.length === 0) {
          dim("No plugins installed.");
          return;
        }

        if (name && !installed[name]) {
          error(`Plugin "${name}" is not installed.`);
          process.exit(1);
          return;
        }

        const upgradeable = ids.filter((id) => {
          const plugin = findPlugin(registry, id);
          return plugin && plugin.version !== installed[id].version;
        });

        if (upgradeable.length === 0) {
          dim(
            name
              ? `${name} is already up to date.`
              : "All plugins are up to date.",
          );
          return;
        }

        const results: Array<{
          id: string;
          from: string;
          to: string;
        }> = [];

        for (const id of upgradeable) {
          const plugin = findPlugin(registry, id)!;
          const entry = installed[id];
          const formats = Object.keys(entry.formats) as PluginFormat[];
          const versionEntry = resolveVersion(plugin);

          for (const format of formats) {
            // Skip formats that don't have a download for this platform -
            // the user may have installed on mac but the new version only ships linux
            const platformFormats = versionEntry.formats[format];
            if (!platformFormats) continue;
            const formatEntry = platformFormats[platform];
            if (!formatEntry) continue;

            const spinner = ora(
              `Upgrading ${chalk.bold(plugin.name)} (${format}) ${entry.version} -> ${plugin.version}`,
            ).start();

            try {
              const data = await downloadFile(formatEntry.url);

              if (!verifyChecksum(data, formatEntry.sha256)) {
                spinner.fail(
                  `Checksum mismatch for ${plugin.name} (${format})`,
                );
                process.exit(1);
              }

              const destDir = paths[format][target];
              const destPaths = await extractAndInstall(
                data,
                formatEntry.artifact,
                destDir,
              );

              await markInstalled(plugin.id, plugin.version, format, destPaths);
              spinner.stop();
              success(
                `${chalk.bold(plugin.name)} ${entry.version} -> ${plugin.version}`,
              );
            } catch (err) {
              spinner.fail(`Failed to upgrade ${plugin.name} (${format})`);
              error(err instanceof Error ? err.message : String(err));
              process.exit(1);
            }
          }

          results.push({
            id,
            from: entry.version,
            to: plugin.version,
          });
        }

        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
        }
      },
    );
}

export { registerUpgrade };
