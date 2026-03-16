import type { Command } from "commander";
import chalk from "chalk";
import { checkbox } from "@inquirer/prompts";
import ora from "ora";
import type { PluginFormat } from "@titrate/registry-schema/schema";
import { FORMAT_PREFERENCE, pluginPaths, type InstallTarget } from "../constants.js";
import { verifyChecksum } from "../lib/checksum.js";
import {
  downloadFile,
  extractAndInstall,
} from "../lib/installer.js";
import { error, success } from "../lib/logger.js";
import { parsePluginRef } from "../lib/parse-plugin-ref.js";
import { currentPlatform } from "../lib/platform.js";
import { availableFormats, findPlugin, getRegistry } from "../lib/registry.js";
import { resolveVersion } from "../lib/resolve-version.js";
import { markInstalled } from "../lib/state.js";

function registerInstall(program: Command): void {
  program
    .command("install <name>")
    .description("Install an audio plugin (supports name@version)")
    .option("-f, --format <format>", "Plugin format (vst3, au, clap, lv2)")
    .option("-t, --target <target>", "Install target (user, system)", "user")
    .option("--json", "Output as JSON")
    .action(
      async (
        input: string,
        options: {
          format?: string;
          target: string;
          json?: boolean;
        },
      ) => {
        const { name, version: requestedVersion } = parsePluginRef(input);
        const platform = currentPlatform();
        const registry = await getRegistry();
        const plugin = findPlugin(registry, name);

        if (!plugin) {
          error(
            `Plugin "${name}" not found. Run \`plug search ${name}\` to browse.`,
          );
          process.exit(1);
          return;
        }

        const version = requestedVersion ?? plugin.version;
        let versionEntry;
        try {
          versionEntry = resolveVersion(plugin, version);
        } catch (err) {
          error(err instanceof Error ? err.message : String(err));
          process.exit(1);
          return;
        }

        const target = options.target as InstallTarget;
        const paths = pluginPaths(platform);
        const available = availableFormats(plugin, platform, version);

        if (available.length === 0) {
          error(
            `"${plugin.name}" has no downloads available for ${platform}.`,
          );
          process.exit(1);
          return;
        }

        let formats: PluginFormat[];
        if (options.format) {
          const fmt = options.format as PluginFormat;
          if (!available.includes(fmt)) {
            error(
              `"${plugin.name}" is not available as ${fmt} on ${platform}. Available: ${available.join(", ")}`,
            );
            process.exit(1);
          }
          formats = [fmt];
        } else if (available.length === 1) {
          formats = available;
        } else {
          // Interactive format selection, VST3 pre-selected
          const ordered = FORMAT_PREFERENCE[platform].filter((f) =>
            available.includes(f),
          );
          formats = await checkbox<PluginFormat>({
            message: `${chalk.bold(plugin.name)} ${chalk.dim(plugin.version)} formats`,
            choices: ordered.map((f) => ({
              name: f.toUpperCase(),
              value: f,
              checked: f === "vst3",
            })),
            shortcuts: { all: null, invert: null },
            theme: {
              style: {
                keysHelpTip: (keys: [string, string][]) =>
                  chalk.dim(keys.map(([key, action]: [string, string]) => `${key} ${action}`).join(", ")),
              },
            },
          });

          if (formats.length === 0) {
            error("No formats selected.");
            process.exit(1);
          }
        }

        const results: Array<{ format: string; path: string }> = [];

        for (const format of formats) {
          // Safe to assert - availableFormats already confirmed this format+platform exists
          const formatEntry = versionEntry.formats[format]![platform]!;
          const spinner = ora(
            `Installing ${chalk.bold(plugin.name)} ${chalk.dim(version)} (${format})`,
          ).start();

          try {
            const data = await downloadFile(formatEntry.url);

            if (formatEntry.sha256 && !verifyChecksum(data, formatEntry.sha256)) {
              spinner.fail(`Checksum mismatch for ${plugin.name} (${format})`);
              error(
                "The download does not match the expected checksum. This could indicate a corrupted or tampered file.",
              );
              process.exit(1);
            }

            const destDir = paths[format][target];
            const destPath = await extractAndInstall(
              data,
              formatEntry.artifact,
              destDir,
            );

            await markInstalled(plugin.id, version, format, destPath);
            results.push({ format, path: destPath });
            spinner.stop();
            success(
              `${chalk.bold(plugin.name)} ${version} ${format} -> ${chalk.dim(destPath)}`,
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
                version,
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
