import { mkdir, readdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { detectDownloadType } from "./detect-download-type.js";
import { ejectDmg, mountDmg } from "./dmg.js";
import { expandPkg, findArtifactInPkg } from "./pkg.js";

async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
  }
  return Buffer.from(await response.arrayBuffer());
}

async function findArtifact(
  dir: string,
  name: string,
): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.name === name) {
      return join(entry.parentPath ?? dir, entry.name);
    }
  }
  return null;
}

function removeQuarantine(path: string): void {
  if (process.platform !== "darwin") return;
  execSync(`xattr -rd com.apple.quarantine "${path}" 2>/dev/null || true`);
}

async function extractAndInstall(
  data: Buffer,
  artifact: string,
  destDir: string,
): Promise<string> {
  const tmpDir = join(tmpdir(), `plug-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  const downloadType = detectDownloadType(data);

  try {
    let artifactPath: string | null = null;

    if (downloadType === "zip") {
      const filePath = join(tmpDir, "download.zip");
      await writeFile(filePath, data);
      execSync(`unzip -o -q "${filePath}" -d "${tmpDir}"`);

      // ZIP might contain raw bundles or a PKG
      const found = await findArtifact(tmpDir, artifact);
      if (found) {
        artifactPath = found;
      } else {
        const entries = await readdir(tmpDir);
        const pkg = entries.find((e) => e.endsWith(".pkg"));
        if (pkg) {
          const expandDir = join(tmpDir, "pkg-expanded");
          expandPkg(join(tmpDir, pkg), expandDir);
          artifactPath = await findArtifactInPkg(
            expandDir,
            artifact,
            findArtifact,
          );
        }
      }
    } else if (downloadType === "dmg") {
      const dmgPath = join(tmpDir, "download.dmg");
      await writeFile(dmgPath, data);

      const mountPoint = join(tmpDir, "mount");
      await mkdir(mountPoint, { recursive: true });
      mountDmg(dmgPath, mountPoint);

      try {
        artifactPath = await findArtifact(mountPoint, artifact);

        if (!artifactPath) {
          const entries = await readdir(mountPoint);
          const pkg = entries.find((e) => e.endsWith(".pkg"));
          if (pkg) {
            const expandDir = join(tmpDir, "pkg-expanded");
            expandPkg(join(mountPoint, pkg), expandDir);
            artifactPath = await findArtifactInPkg(
              expandDir,
              artifact,
              findArtifact,
            );
          }
        }
      } finally {
        ejectDmg(mountPoint);
      }
    } else if (downloadType === "pkg") {
      const pkgPath = join(tmpDir, "download.pkg");
      await writeFile(pkgPath, data);

      const expandDir = join(tmpDir, "pkg-expanded");
      expandPkg(pkgPath, expandDir);
      artifactPath = await findArtifactInPkg(
        expandDir,
        artifact,
        findArtifact,
      );
    }

    if (!artifactPath) {
      throw new Error(`Artifact "${artifact}" not found in download`);
    }

    await mkdir(destDir, { recursive: true });
    const destPath = join(destDir, artifact);

    removeQuarantine(artifactPath);
    execSync(`cp -pR "${artifactPath}" "${destPath}"`);

    return destPath;
  } finally {
    execSync(`rm -rf "${tmpDir}"`);
  }
}

export { downloadFile, extractAndInstall };
