import { readdir, rm } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { FoundArtifact } from "./find-plugin-artifacts.js";
import { findPluginArtifacts } from "./find-plugin-artifacts.js";

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

  const seen = new Set<string>();
  return allArtifacts.filter((r) => {
    const key = `${r.format}:${r.artifact}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { expandAnyPkgs };
