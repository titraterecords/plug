import type { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import type { PluginFormat } from "@titrate/registry-schema/schema";
import { FORMAT_PREFERENCE, type InstallTarget } from "../constants.js";
import {
  downloadFile,
  extractAndInstall,
  resolvePluginPath,
  verifyChecksum,
} from "../lib/installer.js";
import { error, success } from "../lib/logger.js";
import { findPlugin, getRegistry } from "../lib/registry.js";
import { markInstalled } from "../lib/state.js";

function registerInstall(program: Command): void {
  program
    .command("install <name>")
    .description("Install an audio plugin")
    .option("-f, --format <format>", "Plugin format (vst3, au, clap)")
    .option("-t, --target <target>", "Install target (user, system)", "user")
    .option("--json", "Output as JSON")
    .action(
      async (
        name: string,
        options: {
          format?: string;
          target: string;
          json?: boolean;
        },
      ) => {
        const registry = await getRegistry();
        const plugin = findPlugin(registry, name);

        if (!plugin) {
          error(
            `Plugin "${name}" not found. Run \`plug search ${name}\` to browse.`,
          );
          process.exit(1);
          return;
        }

        const target = options.target as InstallTarget;
        const availableFormats = Object.keys(plugin.formats) as PluginFormat[];

        // Determine which formats to install
        let formats: PluginFormat[];
        if (options.format) {
          const fmt = options.format as PluginFormat;
          if (!plugin.formats[fmt]) {
            error(
              `"${plugin.name}" is not available as ${fmt}. Available: ${availableFormats.join(", ")}`,
            );
            process.exit(1);
          }
          formats = [fmt];
        } else {
          // Install all available formats, ordered by preference
          formats = FORMAT_PREFERENCE.filter((f) =>
            availableFormats.includes(f),
          );
        }

        const results: Array<{ format: string; path: string }> = [];

        for (const format of formats) {
          const formatInfo = plugin.formats[format]!;
          const spinner = ora(
            `Installing ${chalk.bold(plugin.name)} (${format})`,
          ).start();

          try {
            const data = await downloadFile(formatInfo.url);

            if (!verifyChecksum(data, formatInfo.sha256)) {
              spinner.fail(`Checksum mismatch for ${plugin.name} (${format})`);
              error(
                "The download does not match the expected checksum. This could indicate a corrupted or tampered file.",
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
            results.push({ format, path: destPath });
            spinner.stop();
            success(
              `${chalk.bold(plugin.name)} ${format} -> ${chalk.dim(destPath)}`,
            );
          } catch (err) {
            spinner.fail(`Failed to install ${plugin.name} (${format})`);
            error(err instanceof Error ? err.message : String(err));
            process.exit(1);
          }
        }

        if (options.json) {
          console.log(
            JSON.stringify(
              {
                id: plugin.id,
                name: plugin.name,
                version: plugin.version,
                installed: results,
              },
              null,
              2,
            ),
          );
        }
      },
    );
}

export { registerInstall };
