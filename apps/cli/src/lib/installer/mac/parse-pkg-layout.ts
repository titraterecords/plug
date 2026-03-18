import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

type PkgItemType =
  | "vst3"
  | "au"
  | "clap"
  | "lv2"
  | "vst2"
  | "resource"
  | "app"
  | "unknown";

interface PkgPayloadItem {
  destPath: string;
  sourcePath: string;
  type: PkgItemType;
}

// Ordered by specificity so "/Library/Audio/Plug-Ins/VST3" matches before "/VST"
const CONTAINER_PATHS: Array<[string, PkgItemType]> = [
  ["/Library/Audio/Plug-Ins/VST3", "vst3"],
  ["/Library/Audio/Plug-Ins/Components", "au"],
  ["/Library/Audio/Plug-Ins/CLAP", "clap"],
  ["/Library/Audio/Plug-Ins/LV2", "lv2"],
  ["/Library/Audio/Plug-Ins/VST", "vst2"],
  ["/Library/Application Support", "resource"],
  ["/Library/Audio/Presets", "resource"],
  ["/Applications", "app"],
];

function classifyPath(absolutePath: string): PkgItemType {
  const normalized = absolutePath.replace(/\/$/, "");
  for (const [container, type] of CONTAINER_PATHS) {
    if (normalized === container || normalized.startsWith(container + "/")) return type;
  }
  return "unknown";
}

// True when path is exactly a known container whose children are installable items
function isContainerPath(absolutePath: string): boolean {
  const normalized = absolutePath.replace(/\/$/, "");
  return CONTAINER_PATHS.some(([container]) => normalized === container);
}

function extractInstallLocation(pkgInfoXml: string): string | null {
  const match = pkgInfoXml.match(/install-location="([^"]+)"/);
  return match?.[1] ?? null;
}

// Pattern B: install-location is "/" so the real paths live inside Payload/.
// Walks top-level entries under Payload/Library/... to find install targets.
async function walkRootPayload(
  payloadDir: string,
): Promise<PkgPayloadItem[]> {
  const items: PkgPayloadItem[] = [];

  async function collectAtDepth(dir: string, depth: number): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const destPath = "/" + relative(payloadDir, fullPath);

      // At a known container (e.g. /Library/Audio/Plug-Ins/VST3),
      // each child is an installable item
      if (isContainerPath(destPath) && entry.isDirectory()) {
        const children = await readdir(fullPath, { withFileTypes: true });
        for (const child of children) {
          const childDest = destPath + "/" + child.name;
          items.push({
            destPath: childDest,
            sourcePath: join(fullPath, child.name),
            type: classifyPath(childDest),
          });
        }
        continue;
      }

      // Keep walking until we hit a container directory or run out of depth
      if (entry.isDirectory() && depth < 5) {
        await collectAtDepth(fullPath, depth + 1);
      }
    }
  }

  await collectAtDepth(payloadDir, 0);
  return items;
}

// Reads an expanded PKG and returns what it contains and where each item
// should be installed. Handles both explicit install-location sub-packages
// (Pattern A) and root-relative payloads (Pattern B).
async function parsePkgLayout(expandedDir: string): Promise<PkgPayloadItem[]> {
  const entries = await readdir(expandedDir, { withFileTypes: true });
  const items: PkgPayloadItem[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.endsWith(".pkg")) continue;

    const subPkgDir = join(expandedDir, entry.name);
    const pkgInfoPath = join(subPkgDir, "PackageInfo");

    let pkgInfo: string;
    try {
      pkgInfo = await readFile(pkgInfoPath, "utf-8");
    } catch {
      continue;
    }

    // Missing install-location means root-relative payload (same as "/")
    const installLocation = extractInstallLocation(pkgInfo) ?? "/";

    const payloadDir = join(subPkgDir, "Payload");
    const payloadExists = await stat(payloadDir).catch(() => null);
    if (!payloadExists?.isDirectory()) continue;

    if (installLocation === "/") {
      const rootItems = await walkRootPayload(payloadDir);
      items.push(...rootItems);
      continue;
    }

    // Pattern A: explicit install-location points to a known path.
    // Each child in Payload/ is an artifact to install at that location.
    const type = classifyPath(installLocation);
    const children = await readdir(payloadDir, { withFileTypes: true });

    for (const child of children) {
      items.push({
        destPath: installLocation.replace(/\/$/, "") + "/" + child.name,
        sourcePath: join(payloadDir, child.name),
        type,
      });
    }
  }

  return items;
}

export { parsePkgLayout, classifyPath, extractInstallLocation };
export type { PkgPayloadItem, PkgItemType };
