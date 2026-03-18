import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parsePkgLayout,
  classifyPath,
  extractInstallLocation,
} from "./parse-pkg-layout.js";

describe("classifyPath", () => {
  it("classifies VST3 plugin path", () => {
    expect(classifyPath("/Library/Audio/Plug-Ins/VST3/Surge XT.vst3")).toBe(
      "vst3",
    );
  });

  it("classifies AU plugin path", () => {
    expect(
      classifyPath("/Library/Audio/Plug-Ins/Components/Dexed.component"),
    ).toBe("au");
  });

  it("classifies CLAP plugin path", () => {
    expect(classifyPath("/Library/Audio/Plug-Ins/CLAP/Vital.clap")).toBe(
      "clap",
    );
  });

  it("classifies LV2 plugin path", () => {
    expect(classifyPath("/Library/Audio/Plug-Ins/LV2/ZamComp.lv2")).toBe(
      "lv2",
    );
  });

  it("classifies VST2 (legacy) plugin path", () => {
    expect(classifyPath("/Library/Audio/Plug-Ins/VST/OldPlugin.vst")).toBe(
      "vst2",
    );
  });

  it("classifies Application Support as resource", () => {
    expect(
      classifyPath("/Library/Application Support/Cardinal/resources"),
    ).toBe("resource");
  });

  it("classifies Audio Presets as resource", () => {
    expect(classifyPath("/Library/Audio/Presets/Helm/Default.fxp")).toBe(
      "resource",
    );
  });

  it("classifies Applications path as app", () => {
    expect(classifyPath("/Applications/Surge XT.app")).toBe("app");
  });

  it("classifies unrecognized path as unknown", () => {
    expect(classifyPath("/usr/local/bin/something")).toBe("unknown");
  });
});

describe("extractInstallLocation", () => {
  it("extracts install-location from PackageInfo XML", () => {
    const xml = `<pkg-info install-location="/Library/Audio/Plug-Ins/VST3/" auth="root">`;
    expect(extractInstallLocation(xml)).toBe(
      "/Library/Audio/Plug-Ins/VST3/",
    );
  });

  it("returns null when no install-location exists", () => {
    const xml = `<pkg-info auth="root">`;
    expect(extractInstallLocation(xml)).toBeNull();
  });

  it("extracts root install-location", () => {
    const xml = `<pkg-info install-location="/" auth="root">`;
    expect(extractInstallLocation(xml)).toBe("/");
  });
});

describe("parsePkgLayout", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `plug-test-pkg-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("parses Pattern A: explicit install-location per sub-package", async () => {
    // Simulate Cardinal's PKG structure
    const vst3Pkg = join(tmpDir, "cardinal-vst3.pkg");
    await mkdir(join(vst3Pkg, "Payload", "Cardinal.vst3"), { recursive: true });
    await writeFile(
      join(vst3Pkg, "PackageInfo"),
      `<pkg-info install-location="/Library/Audio/Plug-Ins/VST3/" auth="root">`,
    );

    const resourcePkg = join(tmpDir, "cardinal-resources.pkg");
    await mkdir(join(resourcePkg, "Payload", "presets"), { recursive: true });
    await writeFile(
      join(resourcePkg, "PackageInfo"),
      `<pkg-info install-location="/Library/Application Support/Cardinal/" auth="root">`,
    );

    const items = await parsePkgLayout(tmpDir);

    expect(items).toHaveLength(2);

    const vst3Item = items.find((i) => i.type === "vst3");
    expect(vst3Item).toBeDefined();
    expect(vst3Item!.destPath).toBe(
      "/Library/Audio/Plug-Ins/VST3/Cardinal.vst3",
    );

    const resourceItem = items.find((i) => i.type === "resource");
    expect(resourceItem).toBeDefined();
    expect(resourceItem!.destPath).toBe(
      "/Library/Application Support/Cardinal/presets",
    );
  });

  it("parses Pattern B: root-relative payload with nested structure", async () => {
    // Simulate Helm's PKG structure: install-location="/"
    const helmPkg = join(tmpDir, "helm.pkg");
    const payload = join(helmPkg, "Payload");
    await mkdir(join(payload, "Library/Audio/Plug-Ins/VST3/helm.vst3"), {
      recursive: true,
    });
    await mkdir(join(payload, "Library/Audio/Presets/Helm"), {
      recursive: true,
    });
    await writeFile(
      join(helmPkg, "PackageInfo"),
      `<pkg-info install-location="/" auth="root">`,
    );

    const items = await parsePkgLayout(tmpDir);

    expect(items).toHaveLength(2);

    const vst3Item = items.find((i) => i.type === "vst3");
    expect(vst3Item).toBeDefined();
    expect(vst3Item!.destPath).toBe(
      "/Library/Audio/Plug-Ins/VST3/helm.vst3",
    );

    const presetItem = items.find((i) => i.type === "resource");
    expect(presetItem).toBeDefined();
    expect(presetItem!.destPath).toBe("/Library/Audio/Presets/Helm");
  });

  it("skips sub-packages without PackageInfo", async () => {
    const noPkgInfo = join(tmpDir, "broken.pkg");
    await mkdir(join(noPkgInfo, "Payload"), { recursive: true });

    const items = await parsePkgLayout(tmpDir);
    expect(items).toHaveLength(0);
  });

  it("skips entries that are not .pkg directories", async () => {
    // A regular file and a non-.pkg directory should be ignored
    await writeFile(join(tmpDir, "Distribution"), "<xml/>");
    await mkdir(join(tmpDir, "Resources"), { recursive: true });

    const items = await parsePkgLayout(tmpDir);
    expect(items).toHaveLength(0);
  });

  it("handles multiple sub-packages with different formats", async () => {
    const vst3Pkg = join(tmpDir, "plugin-vst3.pkg");
    await mkdir(join(vst3Pkg, "Payload", "Test.vst3"), { recursive: true });
    await writeFile(
      join(vst3Pkg, "PackageInfo"),
      `<pkg-info install-location="/Library/Audio/Plug-Ins/VST3/" auth="root">`,
    );

    const auPkg = join(tmpDir, "plugin-au.pkg");
    await mkdir(join(auPkg, "Payload", "Test.component"), { recursive: true });
    await writeFile(
      join(auPkg, "PackageInfo"),
      `<pkg-info install-location="/Library/Audio/Plug-Ins/Components/" auth="root">`,
    );

    const clapPkg = join(tmpDir, "plugin-clap.pkg");
    await mkdir(join(clapPkg, "Payload", "Test.clap"), { recursive: true });
    await writeFile(
      join(clapPkg, "PackageInfo"),
      `<pkg-info install-location="/Library/Audio/Plug-Ins/CLAP/" auth="root">`,
    );

    const items = await parsePkgLayout(tmpDir);

    expect(items).toHaveLength(3);
    expect(items.map((i) => i.type).sort()).toEqual(["au", "clap", "vst3"]);
  });
});
