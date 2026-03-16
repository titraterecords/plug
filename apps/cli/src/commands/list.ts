import type { Command } from "commander";
import chalk from "chalk";
import { dim } from "../lib/logger.js";
import { getRegistry } from "../lib/registry.js";
import { loadInstalled } from "../lib/state.js";

function registerList(program: Command): void {
  program
    .command("list")
    .description("List installed plugins")
    .option("--outdated", "Show only plugins with updates available")
    .option("--json", "Output as JSON")
    .addHelpText("after", `
Examples:
  plug list
  plug list --outdated`)
    .action(async (options: { outdated?: boolean; json?: boolean }) => {
      const installed = await loadInstalled();
      const ids = Object.keys(installed);

      if (ids.length === 0) {
        dim("No plugins installed. Run `plug search` to find plugins.");
        return;
      }

      const registry = options.outdated ? await getRegistry() : null;

      const rows = ids.map((id) => {
        const entry = installed[id];
        const formats = Object.keys(entry.formats).join(", ");
        const registryPlugin = registry?.plugins.find((p) => p.id === id);
        const outdated =
          registryPlugin && registryPlugin.version !== entry.version;

        return {
          id,
          version: entry.version,
          formats,
          outdated,
          latestVersion: registryPlugin?.version,
        };
      });

      const filtered = options.outdated ? rows.filter((r) => r.outdated) : rows;

      if (options.json) {
        console.log(JSON.stringify(filtered, null, 2));
        return;
      }

      if (filtered.length === 0 && options.outdated) {
        dim("All plugins are up to date.");
        return;
      }

      for (const row of filtered) {
        const version = row.outdated
          ? `${chalk.red(row.version)} -> ${chalk.green(row.latestVersion)}`
          : chalk.dim(row.version);
        console.log(
          `${chalk.bold(row.id.padEnd(24))}  ${version}  ${chalk.dim(`[${row.formats}]`)}`,
        );
      }
    });
}

export { registerList };
