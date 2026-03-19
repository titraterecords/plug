import { execSync } from "node:child_process";
import { find7z } from "./win/seven-zip.js";

const isWin = process.platform === "win32";

// On Windows, prefer 7-Zip for extraction — PowerShell's Expand-Archive
// is extremely slow on large archives (Cardinal's 1.1 GB zip takes 15+
// minutes vs seconds with 7-Zip). Falls back to Expand-Archive if 7-Zip
// is not installed.
function extractZip(filePath: string, destDir: string): void {
  if (isWin) {
    const sz = find7z();
    if (sz) {
      execSync(`"${sz}" x "${filePath}" -o"${destDir}" -y`, {
        stdio: "ignore",
      });
    } else {
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${filePath.replaceAll("'", "''")}' -DestinationPath '${destDir.replaceAll("'", "''")}'"`,
      );
    }
  } else {
    execSync(`unzip -o -q "${filePath}" -d "${destDir}"`);
  }
}

export { extractZip };
