import { Command } from "commander";
import { registerInfo } from "./commands/info.js";
import { registerInstall } from "./commands/install.js";
import { registerList } from "./commands/list.js";
import { registerSearch } from "./commands/search.js";
import { registerUninstall } from "./commands/uninstall.js";
import { registerUpgrade } from "./commands/upgrade.js";
import { registerClearCache } from "./commands/clear-cache.js";
import { registerUpdate } from "./commands/update.js";
import { registerLanguage } from "./commands/language.js";
import chalk from "chalk";
import { printBanner } from "./lib/banner.js";
import { checkForUpdate, loadVersionCache } from "./lib/version.js";

const VERSION = "0.4.1";

// Skip update banner for --version and --help
const args = process.argv.slice(2);
const skipBanner =
  args.includes("--version") ||
  args.includes("-V") ||
  args.includes("--help") ||
  args.includes("-h") ||
  args.length === 0;

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

const cached = await loadVersionCache();
if (!skipBanner && cached && isNewer(cached.latest, VERSION)) {
  const isStandalone = process.argv[1]?.includes(".plug/bin");
  const updateCmd = isStandalone
    ? "curl -fsSL plug.audio/install.sh | sh"
    : "npm install -g @titrate/plug@latest";

  const line1 = `Update available  ${chalk.dim(VERSION)} ${chalk.white("→")} ${chalk.green(cached.latest)}`;
  const line2 = `Run: ${chalk.cyan(updateCmd)}`;

  const content = [line1, line2];
  // eslint-disable-next-line no-control-regex
  const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
  const maxLen = Math.max(...content.map((l) => stripAnsi(l).length));
  const pad = (s: string) => {
    const visible = stripAnsi(s).length;
    return s + " ".repeat(maxLen - visible);
  };

  console.log();
  console.log(
    `  ${chalk.green("╭")}${"─".repeat(maxLen + 2)}${chalk.green("╮")}`,
  );
  for (const line of content) {
    console.log(`  ${chalk.green("│")} ${pad(line)} ${chalk.green("│")}`);
  }
  console.log(
    `  ${chalk.green("╰")}${"─".repeat(maxLen + 2)}${chalk.green("╯")}`,
  );
  console.log();
}

// Background check for next run (non-blocking, fire-and-forget)
checkForUpdate(VERSION).catch(() => {});

const program = new Command();

program
  .name("plug")
  .description("Audio plugin manager")
  .version(VERSION)
  .helpOption("-h, --help", "Display help for command")
  .configureHelp({ showGlobalOptions: false })
  .addHelpText("beforeAll", "")
  .addHelpText("after", () => {
    const cmdCol = 13;
    const argsCol = 18;
    const row = (cmd: string, args: string, desc: string) =>
      `  ${cmd.padEnd(cmdCol)}${args.padEnd(argsCol)}${desc}`;

    const pluginCmds = [
      ["install", "[options] <name>", "Install an audio plugin"],
      ["search", "[options] [query]", "Search for audio plugins"],
      ["list", "[options]", "List installed plugins"],
      ["info", "[options] <name>", "Show plugin details"],
      ["upgrade", "[options] [name]", "Upgrade installed plugins"],
      ["uninstall", "[options] [name]", "Remove an installed plugin"],
    ];

    const cliCmds = [
      ["language", "", "Set display language"],
      ["update", "", "Update plug to the latest version"],
      ["clear-cache", "", "Clear cached registry and version data"],
      ["help", "[command]", "Display help for command"],
    ];

    const lines = [
      "",
      "Plugin commands:",
      ...pluginCmds.map(([cmd, args, desc]) => row(cmd, args, desc)),
      "",
      "CLI commands:",
      ...cliCmds.map(([cmd, args, desc]) => row(cmd, args, desc)),
      "",
    ];

    return lines.join("\n");
  });

// Disable default command listing since we render our own grouped help
program.configureHelp({
  visibleCommands: () => [],
});

registerInstall(program);
registerSearch(program);
registerList(program);
registerInfo(program);
registerUpgrade(program);
registerUninstall(program);
registerClearCache(program);
registerUpdate(program);
registerLanguage(program);

// Show banner when running `plug` with no args
if (args.length === 0) {
  printBanner();
}

await program.parseAsync();
