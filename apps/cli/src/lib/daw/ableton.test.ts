import { describe, expect, it } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { findAbletonPaths } from "./ableton.js";
import { DEFAULT_USER_LIBRARY } from "./default-user-library.js";
import { findAbletonPrefs } from "./find-ableton-prefs.js";
import { parseUserLibrary } from "./parse-library-cfg.js";
import { parseScanPaths } from "./parse-scan-paths.js";
import { parseCustomVstPath } from "./parse-custom-vst-path.js";

const isMac = process.platform === "darwin";
const abletonInstalled = findAbletonPrefs("mac") !== null;

describe("findAbletonPrefs", () => {
  it.skipIf(!isMac || !abletonInstalled)(
    "finds the latest Ableton Live preferences directory on macOS",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      expect(prefsDir).toContain("Library/Preferences/Ableton/Live ");
    },
  );

  it("returns null for a platform with no Ableton installation", () => {
    const platform = isMac ? "win" : "mac";
    expect(findAbletonPrefs(platform)).toBeNull();
  });
});

describe("parseUserLibrary", () => {
  it.skipIf(!isMac || !abletonInstalled)(
    "reads a custom user library path from Library.cfg",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      const userLib = parseUserLibrary(prefsDir);
      // Custom path differs from the macOS default
      expect(userLib).not.toBe(DEFAULT_USER_LIBRARY.mac);
      expect(userLib).toMatch(/^\//);
    },
  );

  it("returns null for a nonexistent preferences directory", () => {
    expect(parseUserLibrary("/nonexistent/path")).toBeNull();
  });
});

describe("parseScanPaths", () => {
  it.skipIf(!isMac || !abletonInstalled)(
    "extracts standard VST3 and VST2 scan paths from PluginScanner.txt",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      const paths = parseScanPaths(prefsDir);

      expect(paths.vst3).toContain(
        join(homedir(), "Library/Audio/Plug-Ins/VST3"),
      );
      expect(paths.vst3).toContain("/Library/Audio/Plug-Ins/VST3");
      expect(paths.vst2).toContain(
        join(homedir(), "Library/Audio/Plug-Ins/VST"),
      );
      expect(paths.vst2).toContain("/Library/Audio/Plug-Ins/VST");
    },
  );

  it("returns empty arrays for a nonexistent preferences directory", () => {
    const paths = parseScanPaths("/nonexistent/path");
    expect(paths.vst3).toEqual([]);
    expect(paths.vst2).toEqual([]);
  });
});

describe("parseCustomVstPath", () => {
  it.skipIf(!isMac || !abletonInstalled)(
    "reads VST2 custom path from binary Preferences.cfg",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      const prefs = parseCustomVstPath(prefsDir, "vst2");

      expect(prefs.systemEnabled).toBe(true);
    },
  );

  it.skipIf(!isMac || !abletonInstalled)(
    "reads VST3 custom path from binary Preferences.cfg",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      const prefs = parseCustomVstPath(prefsDir, "vst3");

      expect(prefs.systemEnabled).toBe(true);
    },
  );

  it("returns defaults for a nonexistent preferences directory", () => {
    const prefs = parseCustomVstPath("/nonexistent/path", "vst2");
    expect(prefs.systemEnabled).toBe(false);
    expect(prefs.customEnabled).toBe(false);
    expect(prefs.customPath).toBeNull();
  });
});

describe("findAbletonPaths", () => {
  it.skipIf(!isMac || !abletonInstalled)(
    "returns complete Ableton path info on a machine with Live installed",
    () => {
      const result = findAbletonPaths("mac")!;

      expect(result.version).toMatch(/^12\.\d+\.\d+$/);
      expect(result.userLibrary).toMatch(/^\//);
      expect(result.scanPaths.vst3).toContain(
        join(homedir(), "Library/Audio/Plug-Ins/VST3"),
      );
      expect(result.scanPaths.vst2).toContain(
        join(homedir(), "Library/Audio/Plug-Ins/VST"),
      );
    },
  );

  it("returns null when Ableton is not installed", () => {
    expect(findAbletonPaths("win")).toBeNull();
  });
});
