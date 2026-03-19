import { Option, type Command } from "commander";
import chalk from "chalk";
import { checkbox } from "@inquirer/prompts";
import ora from "ora";
import type { PluginFormat } from "@titrate/registry-schema/schema";
import {
  FORMAT_PREFERENCE,
  pluginPaths,
  type InstallTarget,
} from "../constants.js";
import { verifyChecksum } from "../lib/checksum.js";
import { downloadFile } from "../lib/installer/download.js";
import { extractAndInstall } from "../lib/installer/install.js";
import { isPkg } from "../lib/installer/is-pkg.js";
import { installPkg } from "../lib/installer/mac/install-pkg.js";
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
    .addOption(new Option("--skip-winget").default(false).hideHelp())
    .addHelpText(
      "after",
      `
Examples:
  plug install ott
  plug install surge-xt -f vst3
  plug install dexed@1.0.1`,
    )
    .action(
      async (
        input: string,
        options: {
          format?: string;
          target: string;
          json?: boolean;
          skipWinget?: boolean;
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

        // Some plugins need system paths (e.g. /Library/Application Support/)
        // which require admin permissions on macOS
        if (plugin.systemInstall && platform === "mac" && process.getuid?.() !== 0 && !process.env.PLUG_HOME) {
          error(
            `"${plugin.name}" requires system-level installation for its resources.\nRun: sudo plug install ${name}`,
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
          error(`"${plugin.name}" has no downloads available for ${platform}.`);
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
          try {
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
                    chalk.dim(
                      keys
                        .map(
                          ([key, action]: [string, string]) =>
                            `${key} ${action}`,
                        )
                        .join(", "),
                    ),
                },
              },
            });
          } catch {
            return;
          }

          if (formats.length === 0) {
            error("No formats selected.");
            process.exit(1);
          }
        }

        // Check write permissions before downloading (Windows)
        if (platform === "win" && !process.env.PLUG_HOME) {
          const testDir = paths[formats[0]][target];
          try {
            const { mkdirSync, writeFileSync, unlinkSync } = await import("node:fs");
            mkdirSync(testDir, { recursive: true });
            const testFile = `${testDir}\\.plug-perm-check`;
            writeFileSync(testFile, "");
            unlinkSync(testFile);
          } catch {
            error(
              "Cannot write to the plugin directory. Right-click your terminal and select \"Run as administrator\", then try again.",
            );
            process.exit(1);
          }
        }

        const results: Array<{ format: string; paths: string[] }> = [];

        for (const format of formats) {
          // Safe to assert - availableFormats already confirmed this format+platform exists
          const formatEntry = versionEntry.formats[format]![platform]!;
          const spinner = ora(
            `Installing ${chalk.bold(plugin.name)} ${chalk.dim(version)} (${format})`,
          ).start();

          try {
            const data = await downloadFile(formatEntry.url);

            if (!verifyChecksum(data, formatEntry.sha256)) {
              spinner.fail(`Checksum mismatch for ${plugin.name} (${format})`);
              error(
                "The download does not match the expected checksum. This could indicate a corrupted or tampered file.",
              );
              process.exit(1);
            }

            // PKGs contain sub-packages with install-location metadata
            // that determines where each artifact goes. Route to the
            // multi-destination PKG installer instead of the generic flow.
            if (isPkg(data)) {
              const pkgResult = await installPkg(data, [format], target);
              const allPaths = [...pkgResult.plugins, ...pkgResult.resources];
              await markInstalled(plugin.id, version, format, allPaths);
              results.push({ format, paths: allPaths });
              spinner.stop();
              for (const p of pkgResult.plugins) {
                success(
                  `${chalk.bold(plugin.name)} ${version} ${format} -> ${chalk.dim(p)}`,
                );
              }
              for (const p of pkgResult.resources) {
                success(
                  `${chalk.bold(plugin.name)} ${version} resource -> ${chalk.dim(p)}`,
                );
              }
              continue;
            }

            const destDir = paths[format][target];
            const destPaths = await extractAndInstall(
              data,
              formatEntry.artifact,
              destDir,
              { skipWinget: options.skipWinget },
            );

            await markInstalled(plugin.id, version, format, destPaths);
            results.push({ format, paths: destPaths });
            spinner.stop();
            for (const p of destPaths) {
              success(
                `${chalk.bold(plugin.name)} ${version} ${format} -> ${chalk.dim(p)}`,
              );
            }
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
