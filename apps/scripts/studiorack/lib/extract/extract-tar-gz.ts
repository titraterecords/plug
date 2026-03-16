import { writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { FoundArtifact } from "./find-plugin-artifacts.js";
import { findPluginArtifacts } from "./find-plugin-artifacts.js";

async function extractTarGz(
  data: Buffer,
  tmpDir: string,
): Promise<FoundArtifact[]> {
  const tarPath = join(tmpDir, "download.tar.gz");
  await writeFile(tarPath, data);
  execSync(`tar -xzf "${tarPath}" -C "${tmpDir}" 2>/dev/null || true`);
  return findPluginArtifacts(tmpDir);
}

export { extractTarGz };
