import { readFile, readdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";

function expandPkg(pkgPath: string, destDir: string): void {
  execSync(`pkgutil --expand-full "${pkgPath}" "${destDir}"`);
}

// Some PKGs (like TDR Nova) use install-location metadata instead of
// nesting the artifact inside a Payload directory with its original name.
// When a direct name match fails, this reads each sub-package's PackageInfo
// XML to find where the payload was meant to be installed.
async function findArtifactInPkg(
  expandedDir: string,
  artifact: string,
  findArtifact: (dir: string, name: string) => Promise<string | null>,
): Promise<string | null> {
  const found = await findArtifact(expandedDir, artifact);
  if (found) return found;

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
