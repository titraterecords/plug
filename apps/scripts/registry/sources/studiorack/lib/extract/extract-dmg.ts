import { mkdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import type { FoundArtifact } from "./find-plugin-artifacts.js";
import { findPluginArtifacts } from "./find-plugin-artifacts.js";
import { expandAnyPkgs } from "./expand-any-pkgs.js";

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
    return expandAnyPkgs(mountPoint);
  } finally {
    execSync(`hdiutil detach "${mountPoint}" -quiet 2>/dev/null || true`);
  }
}

export { extractDmg };
