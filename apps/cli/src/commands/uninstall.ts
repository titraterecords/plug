import type { Command } from "commander";
import { rm } from "node:fs/promises";
import chalk from "chalk";
import { select } from "@inquirer/prompts";
import { error, success } from "../lib/logger.js";
import { findPlugin, getRegistry } from "../lib/registry.js";
import { loadInstalled, markUninstalled } from "../lib/state.js";

async function uninstallPlugin(
  name: string,
  installed: Record<
    string,
    { version: string; formats: Record<string, string | string[]> }
  >,
  json?: boolean,
): Promise<void> {
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

  if (json) {
    console.log(JSON.stringify({ id: name, removed }, null, 2));
  }
}

function registerUninstall(program: Command): void {
  program
    .command("uninstall [name]")
    .description("Remove an installed plugin")
    .option("--json", "Output as JSON")
    .addHelpText(
      "after",
      `
Examples:
  plug uninstall ott
  plug uninstall surge-xt
  plug uninstall            (interactive)`,
    )
    .action(async (name: string | undefined, options: { json?: boolean }) => {
      const installed = await loadInstalled();

      if (name) {
        await uninstallPlugin(name, installed, options.json);
        return;
      }

      // Interactive selection
      const ids = Object.keys(installed);

      if (ids.length === 0) {
        error("No plugins installed.");
        return;
      }

      const registry = await getRegistry();

      let selected: string;
      try {
        selected = await select({
          message: "Select a plugin to uninstall",
          choices: ids.map((id) => {
            const entry = installed[id];
            const plugin = findPlugin(registry, id);
            const label = plugin ? `${plugin.author} - ${plugin.name}` : id;
            const formats = Object.keys(entry.formats)
              .map((f) => f.toUpperCase())
              .join(", ");
            return {
              name: `[${formats}] ${label}`,
              value: id,
            };
          }),
        });
      } catch {
        // User pressed Ctrl+C or ESC
        return;
      }

      await uninstallPlugin(selected, installed, options.json);
    });
}

export { registerUninstall };
