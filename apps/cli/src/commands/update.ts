import type { Command } from "commander";
import { execSync } from "node:child_process";

function registerUpdate(program: Command): void {
  program
    .command("update")
    .description("Update plug to the latest version")
    .action(() => {
      const isStandalone = process.argv[1]?.includes(".plug/bin");
      const cmd = isStandalone
        ? "curl -fsSL plug.audio/install.sh | sh"
        : "npm install -g @titrate/plug@latest";

      console.log(`Running: ${cmd}\n`);

      try {
        execSync(cmd, { stdio: "inherit" });
      } catch {
        console.error(`\nUpdate failed. Run manually: ${cmd}`);
        process.exit(1);
      }
    });
}

export { registerUpdate };
