import { execSync } from "node:child_process";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import ora from "ora";
import { dim, warn } from "../../logger.js";
import type { InstallOptions } from "../install.js";

// Checks common 7-Zip install locations.
// "7z" covers PATH-installed copies, the other two are default
// installer paths for 64-bit and 32-bit Windows.
function find7z(): string | null {
  const paths = [
    "7z",
    "C:\\Program Files\\7-Zip\\7z.exe",
    "C:\\Program Files (x86)\\7-Zip\\7z.exe",
  ];
  for (const p of paths) {
    try {
      execSync(`"${p}" --help`, { stdio: "ignore" });
      return p;
    } catch {
      continue;
    }
  }
  return null;
}

function tryInstall7zWithWinget(): boolean {
  try {
    execSync("winget --version", { stdio: "ignore" });
    execSync(
      "winget install 7zip.7zip --accept-package-agreements --accept-source-agreements",
      { stdio: "ignore" },
    );
    return find7z() !== null;
  } catch {
    return false;
  }
}

// Ensures 7-Zip is available, installing it automatically via winget
// if possible. Falls back to opening the download page interactively.
// In non-interactive environments (CI), fails with clear instructions.
async function ensure7z(options: InstallOptions = {}): Promise<string> {
  const sz = find7z();
  if (sz) return sz;

  options.onInteractive?.();

  const label = options.pluginLabel ?? "This plugin";
  console.log();
  warn(`${label} is packaged as an .exe file.`);
  warn(`To unpack it we need a tiny dependency called ${chalk.bold("7-Zip")}.`);

  if (!options.skipWinget) {
    try {
      execSync("winget --version", { stdio: "ignore" });
      dim(
        "  Don't worry, it's a tiny reputable dependency and we're installing it for you.",
      );
      console.log();
      const spinner = ora("Installing 7-Zip").start();
      const ok = tryInstall7zWithWinget();
      spinner.stop();
      if (ok) return find7z()!;
    } catch {
      // winget not available
    }
  }

  if (!process.stdin.isTTY) {
    throw new Error(
      "7-Zip is required but could not be installed automatically. Run: winget install 7zip.7zip",
    );
  }

  console.log();
  const open = await confirm({
    message: "Open the 7-Zip download page?",
    default: true,
  });

  if (open) {
    try {
      execSync('start "" "https://7-zip.org"', { stdio: "ignore" });
    } catch {
      dim("  https://7-zip.org");
    }
  }

  console.log();
  await confirm({
    message: "Press ENTER once you've installed 7-Zip",
    default: true,
  });

  const after = find7z();
  if (after) return after;

  throw new Error(
    "7-Zip not found. Try opening a new terminal tab and running the command again.",
  );
}

export { ensure7z, find7z };
