import type { Platform } from "@titrate/registry-schema/schema";

const PLATFORM_PATTERNS: [RegExp, Platform][] = [
  [/mac(?:os)?|osx|darwin/i, "mac"],
  [/linux/i, "linux"],
  [/win(?:dows|32|64)?/i, "win"],
];

// Source code archives to skip - these never contain plugin binaries
const SOURCE_SKIP = /^source\b|\.tar\.gz$|source/i;

function isSourceArchive(name: string): boolean {
  if (SOURCE_SKIP.test(name)) {
    // Allow .tar.gz that match a platform (e.g. "plugin-linux.tar.gz")
    const matchesPlatform = PLATFORM_PATTERNS.some(([re]) => re.test(name));
    if (matchesPlatform && !name.toLowerCase().startsWith("source")) {
      return false;
    }
    return true;
  }
  return false;
}

// Maps a GitHub release asset filename to a platform.
// Returns null for source archives and unrecognized filenames.
function matchPlatform(assetName: string): Platform | null {
  if (isSourceArchive(assetName)) return null;

  for (const [pattern, platform] of PLATFORM_PATTERNS) {
    if (pattern.test(assetName)) return platform;
  }

  return null;
}

export { matchPlatform };
