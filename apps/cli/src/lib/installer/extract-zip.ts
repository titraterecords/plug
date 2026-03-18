import { execSync } from "node:child_process";

const isWin = process.platform === "win32";

// PowerShell Expand-Archive on Windows, unzip on Unix.
// Single quotes in paths are escaped for PowerShell's -LiteralPath.
function extractZip(filePath: string, destDir: string): void {
  if (isWin) {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${filePath.replaceAll("'", "''")}' -DestinationPath '${destDir.replaceAll("'", "''")}'"`,
    );
  } else {
    execSync(`unzip -o -q "${filePath}" -d "${destDir}"`);
  }
}

export { extractZip };
