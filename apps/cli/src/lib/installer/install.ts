import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { detectDownloadType } from "./detect-type.js";
import { extractZip } from "./extract-zip.js";
import { findInExtracted } from "./find-artifact.js";
import { mountDmg, ejectDmg } from "./mac/dmg.js";
import { expandPkg } from "./mac/pkg.js";
import { removeQuarantine } from "./mac/quarantine.js";
import { extractExe } from "./win/extract-exe.js";

const isWin = process.platform === "win32";

interface InstallOptions {
  skipWinget?: boolean;
  pluginLabel?: string;
  onInteractive?: () => void;
}

// Routes a downloaded buffer to the correct extractor based on magic bytes.
// Returns the directory where extracted contents can be searched.
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

// Downloads, extracts, and copies plugin artifacts to the target directory.
// Handles all platform-specific extraction (DMG, PKG, ZIP, EXE) and
// cleans up temp files regardless of success or failure.
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

export { extractAndInstall };
export type { InstallOptions };
