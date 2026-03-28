import { basename } from "node:path";
import { findAbletonPrefs } from "./find-ableton-prefs.js";
import { parseUserLibrary } from "./parse-library-cfg.js";
import { parseScanPaths } from "./parse-scan-paths.js";
import { parseCustomVstPath } from "./parse-custom-vst-path.js";
import type { CustomVstPrefs } from "./parse-custom-vst-path.js";
import type { ScanPaths } from "./parse-scan-paths.js";

interface AbletonPaths {
  prefsDir: string;
  version: string;
  userLibrary: string | null;
  scanPaths: ScanPaths;
  vst2Prefs: CustomVstPrefs;
  vst3Prefs: CustomVstPrefs;
}

// Detects Ableton Live installation and returns configured paths.
// Returns null when Ableton Live is not installed.
function findAbletonPaths(
  platform: "mac" | "win",
): AbletonPaths | null {
  const prefsDir = findAbletonPrefs(platform);
  if (!prefsDir) return null;

  const version = basename(prefsDir).replace(/^Live\s+/, "");

  return {
    prefsDir,
    version,
    userLibrary: parseUserLibrary(prefsDir),
    scanPaths: parseScanPaths(prefsDir),
    vst2Prefs: parseCustomVstPath(prefsDir, "vst2"),
    vst3Prefs: parseCustomVstPath(prefsDir, "vst3"),
  };
}

export { findAbletonPaths };
export type { AbletonPaths };
