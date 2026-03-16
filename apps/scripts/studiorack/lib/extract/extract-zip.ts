import { writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { FoundArtifact } from "./find-plugin-artifacts.js";
import { findPluginArtifacts } from "./find-plugin-artifacts.js";
import { expandAnyPkgs } from "./expand-any-pkgs.js";

async function extractZip(
  data: Buffer,
  tmpDir: string,
): Promise<FoundArtifact[]> {
  const zipPath = join(tmpDir, "download.zip");
  await writeFile(zipPath, data);
  execSync(`unzip -o -q "${zipPath}" -d "${tmpDir}" 2>/dev/null || true`);

  // ZIP might contain a PKG - check for it if no plugins found directly
  const artifacts = await findPluginArtifacts(tmpDir);
  if (artifacts.length > 0) return artifacts;

  return expandAnyPkgs(tmpDir);
}

export { extractZip };
