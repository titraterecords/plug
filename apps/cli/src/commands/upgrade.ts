import type { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import type { PluginFormat } from "@titrate/registry-schema/schema";
import { type InstallTarget } from "../constants.js";
import { verifyChecksum } from "../lib/checksum.js";
import {
  downloadFile,
  extractAndInstall,
  resolvePluginPath,
} from "../lib/installer.js";
import { dim, error, success } from "../lib/logger.js";
import { findPlugin, getRegistry } from "../lib/registry.js";
import { loadInstalled, markInstalled } from "../lib/state.js";

function registerUpgrade(program: Command): void {
  program
    .command("upgrade [name]")
    .description("Upgrade installed plugins")
    .option("-t, --target <target>", "Install target (user, system)", "user")
    .option("--json", "Output as JSON")
    .action(
      async (
        name: string | undefined,
        options: { target: string; json?: boolean },
      ) => {
        const registry = await getRegistry();
        const installed = await loadInstalled();
        const target = options.target as InstallTarget;

        // Determine which plugins to upgrade
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

          for (const format of formats) {
            const formatInfo = plugin.formats[format];
            if (!formatInfo) continue;

            const spinner = ora(
              `Upgrading ${chalk.bold(plugin.name)} (${format}) ${entry.version} -> ${plugin.version}`,
            ).start();

            try {
              const data = await downloadFile(formatInfo.url);

              if (!verifyChecksum(data, formatInfo.sha256)) {
                spinner.fail(
                  `Checksum mismatch for ${plugin.name} (${format})`,
                );
                process.exit(1);
              }

              const destDir = resolvePluginPath(format, target);
              const destPath = await extractAndInstall(
                data,
                formatInfo.artifact,
                destDir,
              );

              await markInstalled(plugin.id, plugin.version, format, destPath);
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
