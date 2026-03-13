import { createHash } from "node:crypto";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { PluginFormat } from "@titrate/registry-schema/schema";
import { PLUGIN_PATHS, type InstallTarget } from "../constants.js";

async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

function verifyChecksum(data: Buffer, expected: string): boolean {
  const actual = createHash("sha256").update(data).digest("hex");
  return actual === expected;
}

function computeChecksum(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function resolvePluginPath(
  format: PluginFormat,
  target: InstallTarget,
): string {
  return PLUGIN_PATHS[format][target];
}

async function findArtifact(dir: string, name: string): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.name === name) {
      return join(entry.parentPath ?? dir, entry.name);
    }
  }
  return null;
}

async function extractAndInstall(
  data: Buffer,
  artifact: string,
  destDir: string,
): Promise<string> {
  const tmpDir = join(tmpdir(), `plug-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  const zipPath = join(tmpDir, "download.zip");
  await writeFile(zipPath, data);

  execSync(`unzip -o -q "${zipPath}" -d "${tmpDir}"`);

  const artifactPath = await findArtifact(tmpDir, artifact);
  if (!artifactPath) {
    execSync(`rm -rf "${tmpDir}"`);
    throw new Error(`Artifact "${artifact}" not found in download`);
  }

  await mkdir(destDir, { recursive: true });
  const destPath = join(destDir, artifact);

  // Remove macOS quarantine flag, copy to destination
  execSync(
    `xattr -rd com.apple.quarantine "${artifactPath}" 2>/dev/null || true`,
  );
  execSync(`cp -R "${artifactPath}" "${destPath}"`);
  execSync(`rm -rf "${tmpDir}"`);

  return destPath;
}

export {
  computeChecksum,
  downloadFile,
  extractAndInstall,
  resolvePluginPath,
  verifyChecksum,
};
