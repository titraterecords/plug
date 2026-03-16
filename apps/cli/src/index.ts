import { Command } from "commander";
import { registerInfo } from "./commands/info.js";
import { registerInstall } from "./commands/install.js";
import { registerList } from "./commands/list.js";
import { registerSearch } from "./commands/search.js";
import { registerUninstall } from "./commands/uninstall.js";
import { registerUpgrade } from "./commands/upgrade.js";
import chalk from "chalk";
import { printBanner } from "./lib/banner.js";
import { checkForUpdate, loadVersionCache } from "./lib/version.js";

const VERSION = "0.2.5";

// Skip update banner for --version and --help
const args = process.argv.slice(2);
const skipBanner = args.includes("--version") || args.includes("-V") || args.includes("--help") || args.includes("-h") || args.length === 0;

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
    : "npm update -g @titrate/plug";

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
  console.log(`  ${chalk.green("╭")}${"─".repeat(maxLen + 2)}${chalk.green("╮")}`);
  for (const line of content) {
    console.log(`  ${chalk.green("│")} ${pad(line)} ${chalk.green("│")}`);
  }
  console.log(`  ${chalk.green("╰")}${"─".repeat(maxLen + 2)}${chalk.green("╯")}`);
  console.log();
}

// Background check for next run (non-blocking, fire-and-forget)
checkForUpdate(VERSION).catch(() => {});

const program = new Command();

program
  .name("plug")
  .description("Audio plugin manager for macOS")
  .version(VERSION)
  .addHelpText("beforeAll", "");

registerInstall(program);
registerSearch(program);
registerList(program);
registerInfo(program);
registerUpgrade(program);
registerUninstall(program);

// Show banner when running `plug` with no args
if (args.length === 0) {
  printBanner();
}

await program.parseAsync();
