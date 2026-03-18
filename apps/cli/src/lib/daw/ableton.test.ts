import { describe, expect, it } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { findAbletonPaths, DEFAULT_USER_LIBRARY } from "./ableton.js";
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
      const prefsDir = findAbletonPrefs("mac");
      expect(prefsDir).not.toBeNull();
      expect(prefsDir).toContain("Library/Preferences/Ableton/Live ");
    },
  );

  it("returns null for a platform with no Ableton installation", () => {
    // Windows path won't exist on macOS and vice versa
    const platform = isMac ? "win" : "mac";
    const prefsDir = findAbletonPrefs(platform);
    expect(prefsDir).toBeNull();
  });
});

describe("parseUserLibrary", () => {
  it.skipIf(!isMac || !abletonInstalled)(
    "reads the user library path from Library.cfg",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      const userLib = parseUserLibrary(prefsDir);
      expect(userLib).not.toBeNull();
      // A custom user library path won't match the default
      expect(userLib).not.toBe(DEFAULT_USER_LIBRARY.mac);
    },
  );

  it("returns null for a nonexistent preferences directory", () => {
    const userLib = parseUserLibrary("/nonexistent/path");
    expect(userLib).toBeNull();
  });
});

describe("parseScanPaths", () => {
  it.skipIf(!isMac || !abletonInstalled)(
    "extracts VST3 and VST2 scan paths from PluginScanner.txt",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      const paths = parseScanPaths(prefsDir);

      expect(paths.vst3.length).toBeGreaterThan(0);
      expect(paths.vst2.length).toBeGreaterThan(0);

      // macOS standard VST3 paths
      expect(paths.vst3).toContain(
        join(homedir(), "Library/Audio/Plug-Ins/VST3"),
      );
      expect(paths.vst3).toContain("/Library/Audio/Plug-Ins/VST3");

      // macOS standard VST2 paths
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
    "reads VST2 custom path configuration from binary Preferences.cfg",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      const prefs = parseCustomVstPath(prefsDir, "vst2");

      expect(prefs.systemEnabled).toBe(true);
      // customPath is stored even when disabled
      expect(typeof prefs.customEnabled).toBe("boolean");
      if (prefs.customPath) {
        expect(prefs.customPath.startsWith("/")).toBe(true);
      }
    },
  );

  it.skipIf(!isMac || !abletonInstalled)(
    "reads VST3 custom path configuration from binary Preferences.cfg",
    () => {
      const prefsDir = findAbletonPrefs("mac")!;
      const prefs = parseCustomVstPath(prefsDir, "vst3");

      expect(prefs.systemEnabled).toBe(true);
      expect(typeof prefs.customEnabled).toBe("boolean");
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
      const result = findAbletonPaths("mac");
      expect(result).not.toBeNull();

      expect(result!.version).toMatch(/^\d+\.\d+/);
      expect(result!.userLibrary).not.toBeNull();
      expect(result!.scanPaths.vst3.length).toBeGreaterThan(0);
      expect(result!.scanPaths.vst2.length).toBeGreaterThan(0);
    },
  );

  it("returns null when Ableton is not installed", () => {
    // Windows prefs won't exist on macOS CI
    const result = findAbletonPaths("win");
    expect(result).toBeNull();
  });
});
