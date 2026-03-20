import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// PLUG_HOME must be set before importing modules that read it
const TEST_ROOT = join(tmpdir(), `plug-e2e-${Date.now()}`);
process.env.PLUG_HOME = TEST_ROOT;

import { computeChecksum, verifyChecksum } from "../../lib/checksum.js";
import { downloadFile } from "../../lib/installer/download.js";
import { extractAndInstall } from "../../lib/installer/install.js";
import { pluginPaths } from "../../lib/paths/plugin-paths.js";
import {
  loadInstalled,
  markInstalled,
  markUninstalled,
} from "../../lib/state.js";

let server: ReturnType<typeof createServer>;
let serverUrl: string;
let fixtureZipPath: string;
let fixtureSha256: string;

beforeAll(async () => {
  await mkdir(TEST_ROOT, { recursive: true });

  // Build a fixture zip containing a fake .vst3 bundle
  const fixtureDir = join(TEST_ROOT, "fixture");
  const bundleDir = join(fixtureDir, "FakePlugin.vst3", "Contents");
  await mkdir(bundleDir, { recursive: true });
  await writeFile(
    join(bundleDir, "Info.plist"),
    "<plist><dict><key>CFBundleName</key><string>FakePlugin</string></dict></plist>",
  );

  fixtureZipPath = join(TEST_ROOT, "fixture.zip");
  execSync(`cd "${fixtureDir}" && zip -r "${fixtureZipPath}" FakePlugin.vst3`);

  const zipData = await readFile(fixtureZipPath);
  fixtureSha256 = createHash("sha256").update(zipData).digest("hex");

  // Serve the fixture zip over HTTP
  server = createServer((_req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Length": zipData.length,
    });
    res.end(zipData);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const addr = server.address();
  if (typeof addr === "object" && addr) {
    serverUrl = `http://127.0.0.1:${addr.port}/FakePlugin.zip`;
  }
});

afterAll(async () => {
  server?.close();
  await rm(TEST_ROOT, { recursive: true, force: true });
});

describe("e2e: install flow", () => {
  it("downloads a file from the local server", async () => {
    const data = await downloadFile(serverUrl);
    expect(data.length).toBeGreaterThan(0);
  });

  it("verifies the downloaded checksum", async () => {
    const data = await downloadFile(serverUrl);
    expect(verifyChecksum(data, fixtureSha256)).toBe(true);
  });

  it("rejects a bad checksum", async () => {
    const data = await downloadFile(serverUrl);
    const badHash =
      "0000000000000000000000000000000000000000000000000000000000000000";
    expect(verifyChecksum(data, badHash)).toBe(false);
  });

  it("extracts and installs the plugin to the target path", async () => {
    const data = await downloadFile(serverUrl);
    const paths = pluginPaths("mac");
    const destDir = paths.vst3.user;
    const destPath = await extractAndInstall(data, "FakePlugin.vst3", destDir);

    expect(destPath).toStrictEqual([join(destDir, "FakePlugin.vst3")]);
    expect(existsSync(destPath[0])).toBe(true);
    expect(existsSync(join(destPath[0], "Contents", "Info.plist"))).toBe(true);
  });

  it("computes the correct checksum for the downloaded file", async () => {
    const data = await downloadFile(serverUrl);
    expect(computeChecksum(data)).toBe(fixtureSha256);
  });
});

describe("e2e: state tracking", () => {
  it("marks a plugin as installed and persists to disk", async () => {
    await markInstalled("fake-plugin", "1.0.0", "vst3", [
      join(TEST_ROOT, "plugins/vst3/FakePlugin.vst3"),
    ]);

    const state = await loadInstalled();
    expect(state["fake-plugin"].version).toBe("1.0.0");
    expect(state["fake-plugin"].formats.vst3).toBe(
      join(TEST_ROOT, "plugins/vst3/FakePlugin.vst3"),
    );
  });

  it("removes a plugin from state on uninstall", async () => {
    await markInstalled("fake-plugin", "1.0.0", "vst3", [
      join(TEST_ROOT, "plugins/vst3/FakePlugin.vst3"),
    ]);

    await markUninstalled("fake-plugin");

    const state = await loadInstalled();
    expect(state["fake-plugin"]).toBeUndefined();
  });
});

describe("e2e: full install -> uninstall cycle", () => {
  it("installs a plugin, verifies it exists, uninstalls it, verifies cleanup", async () => {
    const data = await downloadFile(serverUrl);
    expect(verifyChecksum(data, fixtureSha256)).toBe(true);

    const paths = pluginPaths("mac");
    const destDir = paths.vst3.user;
    const destPath = await extractAndInstall(data, "FakePlugin.vst3", destDir);
    await markInstalled("fake-plugin", "1.0.0", "vst3", destPath);

    // Plugin file exists on disk
    expect(existsSync(destPath[0])).toBe(true);

    // State reflects the install
    const stateAfterInstall = await loadInstalled();
    expect(stateAfterInstall["fake-plugin"].version).toBe("1.0.0");

    // Uninstall: remove files and state
    await rm(destPath[0], { recursive: true });
    await markUninstalled("fake-plugin");

    // Plugin file is gone
    expect(existsSync(destPath[0])).toBe(false);

    // State reflects the removal
    const stateAfterUninstall = await loadInstalled();
    expect(stateAfterUninstall["fake-plugin"]).toBeUndefined();
  });
});
