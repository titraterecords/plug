import { Command } from "commander";
import { registerInfo } from "./commands/info.js";
import { registerInstall } from "./commands/install.js";
import { registerList } from "./commands/list.js";
import { registerSearch } from "./commands/search.js";
import { registerUninstall } from "./commands/uninstall.js";
import { registerUpgrade } from "./commands/upgrade.js";
import { warn } from "./lib/logger.js";
import { checkForUpdate, loadVersionCache } from "./lib/version.js";

const VERSION = "0.1.1";

// Show cached update notice (fast, no network)
const cached = await loadVersionCache();
if (cached && cached.latest !== VERSION) {
  const isStandalone = process.argv[1]?.includes(".plug/bin");
  const updateCmd = isStandalone
    ? "curl -fsSL https://plug.audio/install.sh | sh"
    : "npm update -g @titrate/plug";
  warn(`plug ${VERSION} -> ${cached.latest} available. Run \`${updateCmd}\` to update.`);
}

// Background check for next run (non-blocking, fire-and-forget)
checkForUpdate(VERSION).catch(() => {});

const program = new Command();

program
  .name("plug")
  .description("Audio plugin manager for macOS")
  .version(VERSION);

registerInstall(program);
registerSearch(program);
registerList(program);
registerInfo(program);
registerUpgrade(program);
registerUninstall(program);

await program.parseAsync();
