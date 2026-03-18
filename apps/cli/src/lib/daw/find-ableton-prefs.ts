import { homedir } from "node:os";
import { join } from "node:path";
import { readdirSync } from "node:fs";

const PREFS_DIRS: Record<string, string> = {
  mac: join(homedir(), "Library/Preferences/Ableton"),
  win: join(
    process.env.APPDATA ?? join(homedir(), "AppData/Roaming"),
    "Ableton",
  ),
};

// Sorts version strings descending so the latest comes first.
// Handles "Live 12.3.6", "Live 11.0.2", etc.
function compareVersionDesc(a: string, b: string): number {
  const parse = (s: string) =>
    s
      .replace(/^Live\s+/, "")
      .split(".")
      .map(Number);
  const [aMajor = 0, aMinor = 0, aPatch = 0] = parse(a);
  const [bMajor = 0, bMinor = 0, bPatch = 0] = parse(b);
  return bMajor - aMajor || bMinor - aMinor || bPatch - aPatch;
}

// Returns the latest Ableton Live preferences directory, or null if not found.
function findAbletonPrefs(platform: "mac" | "win"): string | null {
  const base = PREFS_DIRS[platform];
  if (!base) return null;

  let entries: string[];
  try {
    entries = readdirSync(base);
  } catch {
    return null;
  }

  const versions = entries
    .filter((e) => e.startsWith("Live "))
    .sort(compareVersionDesc);

  if (versions.length === 0) return null;
  return join(base, versions[0]);
}

export { findAbletonPrefs };
