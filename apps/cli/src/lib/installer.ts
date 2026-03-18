import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import chalk from "chalk";
import { confirm } from "@inquirer/prompts";
import ora from "ora";
import { detectDownloadType } from "./detect-download-type.js";
import { ejectDmg, mountDmg } from "./dmg.js";
import { dim, warn } from "./logger.js";
import { expandPkg, findArtifactInPkg } from "./pkg.js";

const isWin = process.platform === "win32";

async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

async function findArtifact(
  dir: string,
  name: string,
): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.name === name) {
      return join(entry.parentPath ?? dir, entry.name);
    }
  }
  return null;
}

function removeQuarantine(path: string): void {
  if (process.platform !== "darwin") return;
  execSync(`xattr -rd com.apple.quarantine "${path}" 2>/dev/null || true`);
}

function extractZip(filePath: string, destDir: string): void {
  if (isWin) {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${filePath.replaceAll("'", "''")}' -DestinationPath '${destDir.replaceAll("'", "''")}'"`
    );
  } else {
    execSync(`unzip -o -q "${filePath}" -d "${destDir}"`);
  }
}

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

interface InstallOptions {
  skipWinget?: boolean;
  pluginLabel?: string;
  onInteractive?: () => void;
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

async function ensure7z(options: InstallOptions = {}): Promise<string> {
  const sz = find7z();
  if (sz) return sz;

  options.onInteractive?.();

  const label = options.pluginLabel ?? "This plugin";
  console.log();
  warn(`${label} is packaged as an .exe file.`);
  warn(
    `To unpack it we need a tiny dependency called ${chalk.bold("7-Zip")}.`,
  );

  // Try winget
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

  // Non-interactive (CI) — just fail with instructions
  if (!process.stdin.isTTY) {
    throw new Error(
      "7-Zip is required but could not be installed automatically. Run: winget install 7zip.7zip",
    );
  }

  // Manual fallback: open browser
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

async function extractExe(filePath: string, destDir: string, options: InstallOptions = {}): Promise<void> {
  const sz = await ensure7z(options);
  execSync(`"${sz}" x "${filePath}" -o"${destDir}" -y`, { stdio: "ignore" });
}

async function extractToDir(
  data: Buffer,
  tmpDir: string,
  options: InstallOptions = {},
): Promise<string> {
  const downloadType = detectDownloadType(data);

  if (downloadType === "zip") {
    const filePath = join(tmpDir, "download.zip");
    await writeFile(filePath, data);
    extractZip(filePath, tmpDir);
    return tmpDir;
  }

  if (downloadType === "dmg") {
    if (isWin) throw new Error("DMG files are not supported on Windows");
    const dmgPath = join(tmpDir, "download.dmg");
    await writeFile(dmgPath, data);
    const mountPoint = join(tmpDir, "mount");
    await mkdir(mountPoint, { recursive: true });
    mountDmg(dmgPath, mountPoint);
    return mountPoint;
  }

  if (downloadType === "pkg") {
    if (isWin) throw new Error("PKG files are not supported on Windows");
    const pkgPath = join(tmpDir, "download.pkg");
    await writeFile(pkgPath, data);
    const expandDir = join(tmpDir, "pkg-expanded");
    expandPkg(pkgPath, expandDir);
    return expandDir;
  }

  if (downloadType === "exe") {
    const exePath = join(tmpDir, "download.exe");
    await writeFile(exePath, data);
    const expandDir = join(tmpDir, "exe-expanded");
    await mkdir(expandDir, { recursive: true });
    await extractExe(exePath, expandDir, options);
    return expandDir;
  }

  throw new Error("Unknown download format");
}

async function findInExtracted(
  searchDir: string,
  tmpDir: string,
  artifactName: string,
  options: InstallOptions = {},
): Promise<string> {
  const found = await findArtifact(searchDir, artifactName);
  if (found) return found;

  // Try inside a nested .pkg (macOS only)
  if (!isWin) {
    const entries = await readdir(searchDir);
    const pkg = entries.find((e) => e.endsWith(".pkg"));
    if (pkg) {
      const expandDir = join(tmpDir, `pkg-expanded-${Date.now()}`);
      expandPkg(join(searchDir, pkg), expandDir);
      const pkgFound = await findArtifactInPkg(expandDir, artifactName, findArtifact);
      if (pkgFound) return pkgFound;
    }
  }

  // Try inside a nested .exe (Windows: zip often wraps an installer)
  if (isWin) {
    const entries = await readdir(searchDir);
    const exe = entries.find((e) => e.endsWith(".exe"));
    if (exe) {
      const expandDir = join(tmpDir, `exe-expanded-${Date.now()}`);
      await mkdir(expandDir, { recursive: true });
      await extractExe(join(searchDir, exe), expandDir, options);
      const exeFound = await findArtifact(expandDir, artifactName);
      if (exeFound) return exeFound;
    }
  }

  throw new Error(`Artifact "${artifactName}" not found in download`);
}

async function extractAndInstall(
  data: Buffer,
  artifact: string | string[],
  destDir: string,
  options: InstallOptions = {},
): Promise<string[]> {
  const artifacts = Array.isArray(artifact) ? artifact : [artifact];
  const tmpDir = join(tmpdir(), `plug-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  try {
    const searchDir = await extractToDir(data, tmpDir, options);
    const isDmg = searchDir.endsWith("/mount");

    try {
      await mkdir(destDir, { recursive: true });
      const destPaths: string[] = [];

      for (const name of artifacts) {
        const artifactPath = await findInExtracted(searchDir, tmpDir, name, options);
        const destPath = join(destDir, name);
        removeQuarantine(artifactPath);
        await cp(artifactPath, destPath, { recursive: true });
        destPaths.push(destPath);
      }

      return destPaths;
    } finally {
      if (isDmg) ejectDmg(searchDir);
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

export { downloadFile, extractAndInstall };
