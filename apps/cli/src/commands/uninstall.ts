import type { Command } from "commander";
import { rm } from "node:fs/promises";
import chalk from "chalk";
import { error, success } from "../lib/logger.js";
import { loadInstalled, markUninstalled } from "../lib/state.js";

function registerUninstall(program: Command): void {
  program
    .command("uninstall <name>")
    .description("Remove an installed plugin")
    .option("--json", "Output as JSON")
    .addHelpText("after", `
Examples:
  plug uninstall ott
  plug uninstall surge-xt`)
    .action(async (name: string, options: { json?: boolean }) => {
      const installed = await loadInstalled();
      const entry = installed[name];

      if (!entry) {
        error(
          `Plugin "${name}" is not installed. Run \`plug list\` to see installed plugins.`,
        );
        process.exit(1);
        return;
      }

      const removed: Array<{ format: string; path: string }> = [];

      for (const [format, pathOrPaths] of Object.entries(entry.formats)) {
        const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
        for (const path of paths) {
          try {
            await rm(path, { recursive: true });
            removed.push({ format, path });
            success(
              `Removed ${chalk.bold(name)} ${format} from ${chalk.dim(path)}`,
            );
          } catch (err) {
            error(
              `Failed to remove ${path}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      }

      await markUninstalled(name);

      if (options.json) {
        console.log(JSON.stringify({ id: name, removed }, null, 2));
      }
    });
}

export { registerUninstall };
