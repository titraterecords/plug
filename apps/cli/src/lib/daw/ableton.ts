import { homedir } from "node:os";
import { join } from "node:path";
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

const DEFAULT_USER_LIBRARY: Record<string, string> = {
  mac: join(homedir(), "Music/Ableton/User Library"),
  win: join(homedir(), "Documents\\Ableton\\User Library"),
};

// Detects Ableton Live installation and returns configured paths.
// Returns null when Ableton Live is not installed.
function findAbletonPaths(
  platform: "mac" | "win",
): AbletonPaths | null {
  const prefsDir = findAbletonPrefs(platform);
  if (!prefsDir) return null;

  // Extract version from directory name ("Live 12.3.6" -> "12.3.6")
  const dirName = prefsDir.split("/").pop() ?? prefsDir.split("\\").pop() ?? "";
  const version = dirName.replace(/^Live\s+/, "");

  return {
    prefsDir,
    version,
    userLibrary: parseUserLibrary(prefsDir),
    scanPaths: parseScanPaths(prefsDir),
    vst2Prefs: parseCustomVstPath(prefsDir, "vst2"),
    vst3Prefs: parseCustomVstPath(prefsDir, "vst3"),
  };
}

export { DEFAULT_USER_LIBRARY, findAbletonPaths };
export type { AbletonPaths };
