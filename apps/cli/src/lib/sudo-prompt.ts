import { execSync } from "node:child_process";
import chalk from "chalk";

// Re-runs the current command with sudo after explaining why.
// Some plugins install to system folders (e.g. /Library/Audio/Plug-Ins)
// which need admin permissions. Rather than failing with a cryptic
// EACCES error, explain the situation in plain language and prompt.
function rerunWithSudo(pluginName: string): void {
  console.log();
  console.log(
    `  ${chalk.bold(pluginName)} needs to install files in a system folder.`,
  );
  console.log(
    `  You'll be asked for your password - it's only used by your`,
  );
  console.log(
    `  computer to allow the install. plug never sees your password.`,
  );
  console.log();

  const cmdArgs = process.argv.slice(1).join(" ");
  execSync(`sudo ${process.argv[0]} ${cmdArgs}`, { stdio: "inherit" });
}

// Checks if an error is a filesystem permission denial
function isPermissionError(err: unknown): boolean {
  return (
    err instanceof Error &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "EACCES"
  );
}

export { isPermissionError, rerunWithSudo };
