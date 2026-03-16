import { readFile, readdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";

function expandPkg(pkgPath: string, destDir: string): void {
  execSync(`pkgutil --expand-full "${pkgPath}" "${destDir}"`);
}

async function findArtifactInPkg(
  expandedDir: string,
  artifact: string,
  findArtifact: (dir: string, name: string) => Promise<string | null>,
): Promise<string | null> {
  // Look for the artifact by name (OTT-style: Payload/OTT.vst3)
  const found = await findArtifact(expandedDir, artifact);
  if (found) return found;

  // Check PackageInfo install-location for flat payloads (TDR Nova-style)
  const entries = await readdir(expandedDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.endsWith(".pkg")) continue;

    const pkgInfoPath = join(expandedDir, entry.name, "PackageInfo");
    try {
      const pkgInfo = await readFile(pkgInfoPath, "utf-8");
      const match = pkgInfo.match(/install-location="([^"]+)"/);
      if (match && match[1].endsWith(artifact)) {
        return join(expandedDir, entry.name, "Payload");
      }
    } catch {
      continue;
    }
  }

  return null;
}

export { expandPkg, findArtifactInPkg };
