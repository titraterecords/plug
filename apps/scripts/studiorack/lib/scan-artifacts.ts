import { createHash } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { FoundArtifact } from "./extract/find-plugin-artifacts.js";
import { extractZip } from "./extract/extract-zip.js";
import { extractTarGz } from "./extract/extract-tar-gz.js";
import { extractDeb } from "./extract/extract-deb.js";
import { extractDmg } from "./extract/extract-dmg.js";
import { extractPkg } from "./extract/extract-pkg.js";

interface ScanResult {
  artifacts: FoundArtifact[];
  sha256: string;
}

// Downloads a file and extracts it to a temp directory, then scans for plugin artifacts.
// Returns artifacts and the computed sha256 of the downloaded file for verification.
async function scanArtifactsFromUrl(url: string): Promise<ScanResult> {
  const tmpDir = join(tmpdir(), `plug-import-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${url}`);
    }
    const data = Buffer.from(await response.arrayBuffer());
    const sha256 = createHash("sha256").update(data).digest("hex");

    const artifacts = await extractAndScan(data, url, tmpDir);
    return { artifacts, sha256 };
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

async function extractAndScan(
  data: Buffer,
  url: string,
  tmpDir: string,
): Promise<FoundArtifact[]> {
  const lower = url.toLowerCase();

  if (lower.endsWith(".zip")) return extractZip(data, tmpDir);
  if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) return extractTarGz(data, tmpDir);
  if (lower.endsWith(".deb")) return extractDeb(data, tmpDir);
  if (lower.endsWith(".dmg")) return extractDmg(data, tmpDir);
  if (lower.endsWith(".pkg")) return extractPkg(data, tmpDir);

  // Try zip as fallback - many URLs don't have extensions
  try {
    return await extractZip(data, tmpDir);
  } catch {
    console.warn(`  Could not extract: ${url}`);
    return [];
  }
}

export { scanArtifactsFromUrl };
export type { FoundArtifact, ScanResult };
