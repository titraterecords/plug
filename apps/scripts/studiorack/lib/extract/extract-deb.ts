import { mkdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { FoundArtifact } from "./find-plugin-artifacts.js";
import { findPluginArtifacts } from "./find-plugin-artifacts.js";

async function extractDeb(
  data: Buffer,
  tmpDir: string,
): Promise<FoundArtifact[]> {
  const debPath = join(tmpDir, "download.deb");
  const extractDir = join(tmpDir, "deb-extracted");
  await mkdir(extractDir, { recursive: true });
  await writeFile(debPath, data);
  execSync(`dpkg-deb -x "${debPath}" "${extractDir}" 2>/dev/null || true`);
  return findPluginArtifacts(extractDir);
}

export { extractDeb };
