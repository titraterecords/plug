// macOS-specific e2e tests for PKG/DMG installation.
// Downloads real plugins to a temp PLUG_HOME and verifies correct
// extraction, format filtering, and resource installation.
//
// These tests are slow (real network downloads) and only run on macOS.
// CI runs them conditionally on the macOS runner.

import { existsSync } from "node:fs";
import { readdir, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const isMac = process.platform === "darwin";

// Set PLUG_HOME before importing modules that read it at load time
const TEST_ROOT = join(tmpdir(), `plug-e2e-mac-${Date.now()}`);
process.env.PLUG_HOME = TEST_ROOT;

import { downloadFile } from "../../lib/installer/download.js";
import { verifyChecksum } from "../../lib/checksum.js";
import { extractAndInstall } from "../../lib/installer/install.js";
import { installPkg } from "../../lib/installer/mac/install-pkg.js";
import { detectDownloadType } from "../../lib/installer/detect-type.js";

beforeAll(async () => {
  await mkdir(TEST_ROOT, { recursive: true });
});

afterAll(async () => {
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe.skipIf(!isMac)("e2e: macOS PKG installation", () => {
  it("installs Spectral Shift VST3 only, excludes AU/CLAP/LV2", async () => {
    const url =
      "https://github.com/trencrumb/SpectralShift/releases/download/v0.1.1/Spectral.Shift-0.1.1-macOS.pkg";
    const data = await downloadFile(url);
    const type = detectDownloadType(data);
    expect(type).toBe("pkg");

    const result = await installPkg(data, ["vst3"], "user");

    expect(result.plugins.length).toBeGreaterThanOrEqual(1);

    // VST3 should exist
    const hasVst3 = result.plugins.some((p) => p.endsWith(".vst3"));
    expect(hasVst3).toBe(true);

    // AU, CLAP, LV2 should NOT exist
    const hasAu = result.plugins.some((p) => p.endsWith(".component"));
    const hasClap = result.plugins.some((p) => p.endsWith(".clap"));
    const hasLv2 = result.plugins.some((p) => p.endsWith(".lv2"));
    expect(hasAu).toBe(false);
    expect(hasClap).toBe(false);
    expect(hasLv2).toBe(false);

    // File should exist on disk
    const vst3Path = result.plugins.find((p) => p.endsWith(".vst3"))!;
    expect(existsSync(vst3Path)).toBe(true);
  }, 60000);

  it("installs Helm with presets (Pattern B: root-relative payload)", async () => {
    const url = "https://tytel.org/static/dist/Helm_v0_9_0_r.pkg";
    const data = await downloadFile(url);

    const result = await installPkg(data, ["vst3"], "user");

    // Should have vst3 plugin
    const hasVst3 = result.plugins.some((p) => p.includes("helm.vst3"));
    expect(hasVst3).toBe(true);

    // Should have presets installed as resources
    expect(result.resources.length).toBeGreaterThanOrEqual(1);
    const hasPresets = result.resources.some((p) => p.includes("Presets"));
    expect(hasPresets).toBe(true);
  }, 60000);

  it("installs SoundMagic Spectral 23 AU components via DMG->PKG chain", async () => {
    const url =
      "https://www.michaelnorris.info/downloads/soundmagicspectral15.dmg";
    const sha256 =
      "386f380f3a78b55e24dd08cd4fe77160b908b76664deeb9b4180448e63240413";
    const data = await downloadFile(url);

    expect(verifyChecksum(data, sha256)).toBe(true);

    // DMG->PKG chain goes through extractAndInstall with the artifact list
    const artifacts = [
      "Chorus.component",
      "GrainStreamer.component",
      "MNSpectralBlurring.component",
      "MNSpectralFreezing.component",
      "MNSpectralGranulation.component",
    ];

    const destDir = join(TEST_ROOT, "plugins/au");
    const paths = await extractAndInstall(data, artifacts, destDir);

    expect(paths).toHaveLength(5);
    for (const p of paths) {
      expect(existsSync(p)).toBe(true);
      expect(p.endsWith(".component")).toBe(true);
    }
  }, 120000);
});
