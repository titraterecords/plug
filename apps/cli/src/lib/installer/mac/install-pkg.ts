import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import type { PluginFormat } from "@titrate/registry-schema/schema";
import type { InstallTarget } from "../../paths/plugin-paths.js";
import { expandPkg } from "./pkg.js";
import { parsePkgLayout } from "./parse-pkg-layout.js";
import type { PkgItemType } from "./parse-pkg-layout.js";
import { resolvePkgDest } from "./resolve-pkg-dest.js";
import { removeQuarantine } from "./quarantine.js";

interface PkgInstallResult {
  plugins: string[];
  resources: string[];
}

const PLUGIN_TYPES: PkgItemType[] = ["vst3", "au", "clap", "lv2", "vst2"];

function isPluginType(type: PkgItemType): boolean {
  return PLUGIN_TYPES.includes(type);
}

function formatMatchesType(format: PluginFormat, type: PkgItemType): boolean {
  return format === type;
}

// Installs a macOS PKG by expanding it, reading each sub-package's
// PackageInfo to determine install destinations, then copying selected
// format plugins and all resources to the correct paths.
async function installPkg(
  data: Buffer,
  selectedFormats: PluginFormat[],
  target: InstallTarget,
): Promise<PkgInstallResult> {
  const tmpDir = join(tmpdir(), `plug-pkg-${Date.now()}`);
  await mkdir(tmpDir, { recursive: true });

  try {
    const pkgPath = join(tmpDir, "download.pkg");
    await writeFile(pkgPath, data);

    const expandDir = join(tmpDir, "pkg-expanded");
    expandPkg(pkgPath, expandDir);

    const layout = await parsePkgLayout(expandDir);
    const result: PkgInstallResult = { plugins: [], resources: [] };

    for (const item of layout) {
      // Skip standalone apps and vst2 (legacy format)
      if (item.type === "app" || item.type === "vst2") continue;

      // Only install plugins that match the user's selected formats
      if (isPluginType(item.type)) {
        const wanted = selectedFormats.some((f) =>
          formatMatchesType(f, item.type),
        );
        if (!wanted) continue;
      }

      // Unknown items could be anything - skip to avoid installing garbage
      if (item.type === "unknown") continue;

      const destPath = resolvePkgDest(item.destPath, target);
      try {
        await mkdir(dirname(destPath), { recursive: true });
      } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code === "EACCES") {
          throw new Error(
            `Permission denied creating ${dirname(destPath)}. This plugin requires system-level resources. Run with sudo or use --target system.`,
          );
        }
        throw err;
      }
      await cp(item.sourcePath, destPath, { recursive: true });

      if (isPluginType(item.type)) {
        removeQuarantine(destPath);
        result.plugins.push(destPath);
      } else {
        result.resources.push(destPath);
      }
    }

    return result;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

export { installPkg };
export type { PkgInstallResult };
