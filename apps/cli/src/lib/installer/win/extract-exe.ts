import { execSync } from "node:child_process";
import { ensure7z } from "./seven-zip.js";
import type { InstallOptions } from "../install.js";

// Extracts a Windows .exe installer (NSIS, Inno Setup, etc.) using 7-Zip.
// 7-Zip treats NSIS installers as archives and extracts the payload
// without running the installer itself - keeping the install reversible.
async function extractExe(
  filePath: string,
  destDir: string,
  options: InstallOptions = {},
): Promise<void> {
  const sz = await ensure7z(options);
  execSync(`"${sz}" x "${filePath}" -o"${destDir}" -y`, { stdio: "ignore" });
}

export { extractExe };
