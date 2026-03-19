import { execSync } from "node:child_process";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";

// Explains why admin permissions are needed and re-runs the command
// with sudo after the user confirms. The password prompt comes from
// the OS, not from plug - we make that clear in the messaging.
// Works on macOS and Linux. Windows uses a separate flow since it
// has no sudo equivalent.
async function confirmAndRerunWithSudo(
  pluginName: string,
  author: string,
): Promise<void> {
  console.log();
  console.log(
    `  ${chalk.bold(pluginName)} by ${author} includes presets and resources`,
  );
  console.log(`  that need to be installed in a system folder.`);
  console.log();
  console.log(`  Your computer will ask for your password to allow this.`);
  console.log(`  plug never sees your password.`);
  console.log();

  try {
    await confirm({
      message: "Press ENTER to continue, or Ctrl+C to cancel",
      default: true,
    });
  } catch {
    // User pressed Ctrl+C
    process.exit(0);
  }

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

export { confirmAndRerunWithSudo, isPermissionError };
