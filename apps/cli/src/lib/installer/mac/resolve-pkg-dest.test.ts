import { describe, expect, it, vi, afterEach } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { resolvePkgDest } from "./resolve-pkg-dest.js";

describe("resolvePkgDest with PLUG_HOME", () => {
  const testHome = "/tmp/plug-test-home";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function withPlugHome() {
    vi.stubEnv("PLUG_HOME", testHome);
  }

  it("maps VST3 path to PLUG_HOME/plugins/vst3", () => {
    withPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/VST3/Test.vst3", "user")).toBe(
      join(testHome, "plugins/vst3/Test.vst3"),
    );
  });

  it("maps AU path to PLUG_HOME/plugins/au", () => {
    withPlugHome();
    expect(
      resolvePkgDest("/Library/Audio/Plug-Ins/Components/Test.component", "user"),
    ).toBe(join(testHome, "plugins/au/Test.component"));
  });

  it("maps CLAP path to PLUG_HOME/plugins/clap", () => {
    withPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/CLAP/Test.clap", "user")).toBe(
      join(testHome, "plugins/clap/Test.clap"),
    );
  });

  it("maps LV2 path to PLUG_HOME/plugins/lv2", () => {
    withPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/LV2/Test.lv2", "user")).toBe(
      join(testHome, "plugins/lv2/Test.lv2"),
    );
  });

  it("maps Application Support to PLUG_HOME/support", () => {
    withPlugHome();
    expect(
      resolvePkgDest("/Library/Application Support/Cardinal/presets", "user"),
    ).toBe(join(testHome, "support/Cardinal/presets"));
  });

  it("maps Audio Presets to PLUG_HOME/presets", () => {
    withPlugHome();
    expect(resolvePkgDest("/Library/Audio/Presets/Helm/Default", "user")).toBe(
      join(testHome, "presets/Helm/Default"),
    );
  });

  it("maps Applications to PLUG_HOME/apps", () => {
    withPlugHome();
    expect(resolvePkgDest("/Applications/Surge XT.app", "user")).toBe(
      join(testHome, "apps/Surge XT.app"),
    );
  });

  it("strips trailing slash from install-location", () => {
    withPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/VST3/", "user")).toBe(
      join(testHome, "plugins/vst3"),
    );
  });

  it("maps unknown paths to PLUG_HOME/other", () => {
    withPlugHome();
    expect(resolvePkgDest("/usr/local/share/plugin-data", "user")).toBe(
      join(testHome, "other/usr/local/share/plugin-data"),
    );
  });
});

describe("resolvePkgDest without PLUG_HOME", () => {
  const home = homedir();

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function withoutPlugHome() {
    vi.stubEnv("PLUG_HOME", "");
  }

  it("maps user VST3 to ~/Library path", () => {
    withoutPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/VST3/Test.vst3", "user")).toBe(
      join(home, "Library/Audio/Plug-Ins/VST3/Test.vst3"),
    );
  });

  it("maps system VST3 to /Library path", () => {
    withoutPlugHome();
    expect(resolvePkgDest("/Library/Audio/Plug-Ins/VST3/Test.vst3", "system")).toBe(
      "/Library/Audio/Plug-Ins/VST3/Test.vst3",
    );
  });

  it("maps user Application Support to ~/Library", () => {
    withoutPlugHome();
    expect(
      resolvePkgDest("/Library/Application Support/Cardinal/presets", "user"),
    ).toBe(join(home, "Library/Application Support/Cardinal/presets"));
  });

  it("maps system Application Support to /Library", () => {
    withoutPlugHome();
    expect(
      resolvePkgDest("/Library/Application Support/Cardinal/presets", "system"),
    ).toBe("/Library/Application Support/Cardinal/presets");
  });

  it("maps user Audio Presets to ~/Library", () => {
    withoutPlugHome();
    expect(resolvePkgDest("/Library/Audio/Presets/Helm/Default", "user")).toBe(
      join(home, "Library/Audio/Presets/Helm/Default"),
    );
  });

  it("always maps /Applications to /Applications regardless of target", () => {
    withoutPlugHome();
    expect(resolvePkgDest("/Applications/Test.app", "user")).toBe(
      "/Applications/Test.app",
    );
    expect(resolvePkgDest("/Applications/Test.app", "system")).toBe(
      "/Applications/Test.app",
    );
  });
});
