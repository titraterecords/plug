import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { expandPkg, findArtifactInPkg } from "./mac/pkg.js";
import { extractExe } from "./win/extract-exe.js";
import type { InstallOptions } from "./install.js";

const isWin = process.platform === "win32";

async function findArtifact(dir: string, name: string): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.name === name) {
      return join(entry.parentPath ?? dir, entry.name);
    }
  }
  return null;
}

// Searches extracted contents for the target artifact.
// Falls back to platform-specific nested extraction when the artifact
// isn't at the top level (macOS DMGs often nest a .pkg, Windows zips
// often wrap an .exe installer).
async function findInExtracted(
  searchDir: string,
  tmpDir: string,
  artifactName: string,
  options: InstallOptions = {},
): Promise<string> {
  const found = await findArtifact(searchDir, artifactName);
  if (found) return found;

  // macOS: DMG contents sometimes contain a .pkg that holds the actual plugin
  if (!isWin) {
    const entries = await readdir(searchDir);
    const pkg = entries.find((e) => e.endsWith(".pkg"));
    if (pkg) {
      const expandDir = join(tmpDir, `pkg-expanded-${Date.now()}`);
      expandPkg(join(searchDir, pkg), expandDir);
      const pkgFound = await findArtifactInPkg(
        expandDir,
        artifactName,
        findArtifact,
      );
      if (pkgFound) return pkgFound;
    }
  }

  // Windows: zip downloads frequently wrap an NSIS/Inno .exe installer
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

export { findArtifact, findInExtracted };
