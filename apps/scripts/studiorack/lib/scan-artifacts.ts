import { createHash } from "node:crypto";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";

const PLUGIN_EXTENSIONS = [".vst3", ".component", ".clap", ".lv2"];

// Maps file extensions to our registry format names
const EXTENSION_TO_FORMAT: Record<string, string> = {
  ".vst3": "vst3",
  ".component": "au",
  ".clap": "clap",
  ".lv2": "lv2",
};

interface FoundArtifact {
  format: string;
  artifact: string;
}

interface ScanResult {
  artifacts: FoundArtifact[];
  sha256: string;
}

// Recursively scans a directory for plugin bundles by extension.
// Returns the artifact filename (e.g. "Surge XT.vst3") and its format.
async function findPluginArtifacts(dir: string): Promise<FoundArtifact[]> {
  const results: FoundArtifact[] = [];
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });

  for (const entry of entries) {
    // Skip macOS resource forks and hidden files
    if (entry.name.startsWith(".")) continue;

    for (const ext of PLUGIN_EXTENSIONS) {
      if (entry.name.endsWith(ext)) {
        const format = EXTENSION_TO_FORMAT[ext];
        results.push({ format, artifact: entry.name });
      }
    }
  }

  // Deduplicate - same artifact can appear in nested dirs
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.format}:${r.artifact}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

  if (lower.endsWith(".zip")) {
    return extractZip(data, tmpDir);
  }
  if (lower.endsWith(".tar.gz") || lower.endsWith(".tgz")) {
    return extractTarGz(data, tmpDir);
  }
  if (lower.endsWith(".deb")) {
    return extractDeb(data, tmpDir);
  }
  if (lower.endsWith(".dmg")) {
    return extractDmg(data, tmpDir);
  }
  if (lower.endsWith(".pkg")) {
    return extractPkg(data, tmpDir);
  }

  // Try zip as fallback - many URLs don't have extensions
  try {
    return await extractZip(data, tmpDir);
  } catch {
    console.warn(`  Could not extract: ${url}`);
    return [];
  }
}

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

async function extractTarGz(
  data: Buffer,
  tmpDir: string,
): Promise<FoundArtifact[]> {
  const tarPath = join(tmpDir, "download.tar.gz");
  await writeFile(tarPath, data);
  execSync(`tar -xzf "${tarPath}" -C "${tmpDir}" 2>/dev/null || true`);
  return findPluginArtifacts(tmpDir);
}

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

async function extractDmg(
  data: Buffer,
  tmpDir: string,
): Promise<FoundArtifact[]> {
  if (process.platform !== "darwin") {
    console.warn("  Skipping DMG - only supported on macOS");
    return [];
  }

  const dmgPath = join(tmpDir, "download.dmg");
  const mountPoint = join(tmpDir, "mount");
  await mkdir(mountPoint, { recursive: true });
  await writeFile(dmgPath, data);

  try {
    execSync(
      `hdiutil attach "${dmgPath}" -mountpoint "${mountPoint}" -nobrowse -quiet`,
    );

    // First check for plugin bundles directly on the DMG
    const artifacts = await findPluginArtifacts(mountPoint);
    if (artifacts.length > 0) return artifacts;

    // No plugins found directly - look for PKGs inside the DMG and expand them
    const pkgArtifacts = await expandAnyPkgs(mountPoint);
    return pkgArtifacts;
  } finally {
    execSync(`hdiutil detach "${mountPoint}" -quiet 2>/dev/null || true`);
  }
}

// Scans a directory for .pkg files, expands each one, and looks for plugins inside.
// Many macOS installers bundle plugins inside a PKG payload.
// Expands into a sibling temp dir because the source dir may be read-only (mounted DMG).
async function expandAnyPkgs(dir: string): Promise<FoundArtifact[]> {
  if (process.platform !== "darwin") return [];

  const entries = await readdir(dir);
  const pkgs = entries.filter((e) => e.endsWith(".pkg"));
  if (pkgs.length === 0) return [];

  const allArtifacts: FoundArtifact[] = [];

  for (const pkg of pkgs) {
    // pkgutil --expand-full requires target dir to not exist
    const expandDir = join(tmpdir(), `plug-pkg-${Date.now()}-${pkg}`);
    try {
      execSync(
        `pkgutil --expand-full "${join(dir, pkg)}" "${expandDir}" 2>/dev/null`,
      );
      const artifacts = await findPluginArtifacts(expandDir);
      allArtifacts.push(...artifacts);
    } catch {
      // Some PKGs are distribution bundles that can't be expanded - skip
    } finally {
      await rm(expandDir, { recursive: true, force: true });
    }
  }

  // Deduplicate across multiple PKGs
  const seen = new Set<string>();
  return allArtifacts.filter((r) => {
    const key = `${r.format}:${r.artifact}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { scanArtifactsFromUrl };
export type { FoundArtifact, ScanResult };
