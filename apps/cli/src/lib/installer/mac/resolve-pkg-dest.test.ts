import { describe, expect, it, vi, afterEach } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { resolvePkgDest } from "./resolve-pkg-dest.js";

const isMac = process.platform === "darwin";

// PKG path resolution is macOS-only
describe.skipIf(!isMac)("resolvePkgDest with PLUG_HOME", () => {
  const testHome = "/tmp/plug-test-home";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function withPlugHome() {
    vi.stubEnv("PLUG_HOME", testHome);
  }

  it("mirrors VST3 path under PLUG_HOME", () => {
    withPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/VST3/Test.vst3", "user")).toBe(
      join(testHome, "Library/Audio/Plug-Ins/VST3/Test.vst3"),
    );
  });

  it("mirrors Application Support under PLUG_HOME", () => {
    withPlugHome();
    expect(
      resolvePkgDest("/Library/Application Support/Cardinal", "user"),
    ).toBe(join(testHome, "Library/Application Support/Cardinal"));
  });

  it("mirrors Applications under PLUG_HOME", () => {
    withPlugHome();
    expect(resolvePkgDest("/Applications/Surge XT.app", "user")).toBe(
      join(testHome, "Applications/Surge XT.app"),
    );
  });

  it("strips trailing slash", () => {
    withPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/VST3/", "user")).toBe(
      join(testHome, "Library/Audio/Plug-Ins/VST3"),
    );
  });

  it("mirrors any path under PLUG_HOME", () => {
    withPlugHome();
    expect(resolvePkgDest("/usr/local/share/plugin-data", "user")).toBe(
      join(testHome, "usr/local/share/plugin-data"),
    );
  });
});

describe.skipIf(!isMac)("resolvePkgDest without PLUG_HOME", () => {
  const home = homedir();

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function withoutPlugHome() {
    vi.stubEnv("PLUG_HOME", "");
  }

  it("rewrites /Library to ~/Library for user target", () => {
    withoutPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/VST3/Test.vst3", "user")).toBe(
      join(home, "Library/Audio/Plug-Ins/VST3/Test.vst3"),
    );
  });

  it("keeps /Library as-is for system target", () => {
    withoutPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/VST3/Test.vst3", "system")).toBe(
      "/Library/Audio/Plug-Ins/VST3/Test.vst3",
    );
  });

  it("rewrites Application Support for user target", () => {
    withoutPlugHome();
    expect(
      resolvePkgDest("/Library/Application Support/Cardinal", "user"),
    ).toBe(join(home, "Library/Application Support/Cardinal"));
  });

  it("keeps /Applications as-is regardless of target", () => {
    withoutPlugHome();
    expect(resolvePkgDest("/Applications/Test.app", "user")).toBe(
      "/Applications/Test.app",
    );
  });

  it("keeps non-Library paths as-is", () => {
    withoutPlugHome();
    expect(resolvePkgDest("/usr/local/share/data", "user")).toBe(
      "/usr/local/share/data",
    );
  });
});
