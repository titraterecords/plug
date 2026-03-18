import { describe, expect, it } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { pluginPaths } from "./constants.js";

describe("pluginPaths", () => {
  const plugHome = process.env.PLUG_HOME;
  const home = homedir();

  it("resolves macOS VST3 user path", () => {
    const paths = pluginPaths("mac");
    const expected = plugHome
      ? join(plugHome, "plugins/vst3")
      : join(home, "Library/Audio/Plug-Ins/VST3");
    expect(paths.vst3.user).toBe(expected);
  });

  it("resolves macOS VST3 system path", () => {
    const paths = pluginPaths("mac");
    const expected = plugHome
      ? join(plugHome, "plugins/vst3")
      : "/Library/Audio/Plug-Ins/VST3";
    expect(paths.vst3.system).toBe(expected);
  });

  it("resolves macOS AU user path", () => {
    const paths = pluginPaths("mac");
    const expected = plugHome
      ? join(plugHome, "plugins/au")
      : join(home, "Library/Audio/Plug-Ins/Components");
    expect(paths.au.user).toBe(expected);
  });

  it("resolves macOS AU system path", () => {
    const paths = pluginPaths("mac");
    const expected = plugHome
      ? join(plugHome, "plugins/au")
      : "/Library/Audio/Plug-Ins/Components";
    expect(paths.au.system).toBe(expected);
  });

  it("resolves macOS CLAP user path", () => {
    const paths = pluginPaths("mac");
    const expected = plugHome
      ? join(plugHome, "plugins/clap")
      : join(home, "Library/Audio/Plug-Ins/CLAP");
    expect(paths.clap.user).toBe(expected);
  });

  it("resolves linux VST3 user path", () => {
    const paths = pluginPaths("linux");
    const expected = plugHome
      ? join(plugHome, "plugins/vst3")
      : join(home, ".vst3");
    expect(paths.vst3.user).toBe(expected);
  });

  it("resolves linux VST3 system path", () => {
    const paths = pluginPaths("linux");
    const expected = plugHome
      ? join(plugHome, "plugins/vst3")
      : "/usr/lib/vst3";
    expect(paths.vst3.system).toBe(expected);
  });

  it("resolves linux LV2 user path", () => {
    const paths = pluginPaths("linux");
    const expected = plugHome
      ? join(plugHome, "plugins/lv2")
      : join(home, ".lv2");
    expect(paths.lv2.user).toBe(expected);
  });

  it("resolves linux CLAP user path", () => {
    const paths = pluginPaths("linux");
    const expected = plugHome
      ? join(plugHome, "plugins/clap")
      : join(home, ".clap");
    expect(paths.clap.user).toBe(expected);
  });
});
