import { describe, expect, it } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { resolvePluginPath } from "./installer.js";

describe("resolvePluginPath", () => {
  const plugHome = process.env.PLUG_HOME;
  const home = homedir();

  it("resolves VST3 user path", () => {
    const expected = plugHome
      ? join(plugHome, "plugins/vst3")
      : join(home, "Library/Audio/Plug-Ins/VST3");
    expect(resolvePluginPath("vst3", "user")).toBe(expected);
  });

  it("resolves VST3 system path", () => {
    const expected = plugHome
      ? join(plugHome, "plugins/vst3")
      : "/Library/Audio/Plug-Ins/VST3";
    expect(resolvePluginPath("vst3", "system")).toBe(expected);
  });

  it("resolves AU user path", () => {
    const expected = plugHome
      ? join(plugHome, "plugins/au")
      : join(home, "Library/Audio/Plug-Ins/Components");
    expect(resolvePluginPath("au", "user")).toBe(expected);
  });

  it("resolves AU system path", () => {
    const expected = plugHome
      ? join(plugHome, "plugins/au")
      : "/Library/Audio/Plug-Ins/Components";
    expect(resolvePluginPath("au", "system")).toBe(expected);
  });

  it("resolves CLAP user path", () => {
    const expected = plugHome
      ? join(plugHome, "plugins/clap")
      : join(home, "Library/Audio/Plug-Ins/CLAP");
    expect(resolvePluginPath("clap", "user")).toBe(expected);
  });

  it("resolves CLAP system path", () => {
    const expected = plugHome
      ? join(plugHome, "plugins/clap")
      : "/Library/Audio/Plug-Ins/CLAP";
    expect(resolvePluginPath("clap", "system")).toBe(expected);
  });
});
