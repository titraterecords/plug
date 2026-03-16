import { writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { FoundArtifact } from "./find-plugin-artifacts.js";
import { findPluginArtifacts } from "./find-plugin-artifacts.js";

// Expands a standalone PKG using pkgutil --expand-full, then scans for plugins.
async function extractPkg(
  data: Buffer,
  tmpDir: string,
): Promise<FoundArtifact[]> {
  if (process.platform !== "darwin") {
    console.warn("  Skipping PKG - only supported on macOS");
    return [];
  }

  const pkgPath = join(tmpDir, "download.pkg");
  await writeFile(pkgPath, data);

  const expandDir = join(tmpDir, "pkg-expanded");
  try {
    execSync(`pkgutil --expand-full "${pkgPath}" "${expandDir}" 2>/dev/null`);
  } catch {
    return [];
  }

  return findPluginArtifacts(expandDir);
}

export { extractPkg };
