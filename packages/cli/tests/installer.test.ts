import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  computeChecksum,
  resolvePluginPath,
  verifyChecksum,
} from "../src/lib/installer.js";

describe("verifyChecksum", () => {
  it("returns true for matching checksum", () => {
    const data = Buffer.from("hello world");
    const expected = createHash("sha256").update(data).digest("hex");

    expect(verifyChecksum(data, expected)).toBe(true);
  });

  it("returns false for mismatched checksum", () => {
    const data = Buffer.from("hello world");
    const wrong =
      "0000000000000000000000000000000000000000000000000000000000000000";

    expect(verifyChecksum(data, wrong)).toBe(false);
  });

  it("handles empty buffer", () => {
    const data = Buffer.from("");
    // SHA256 of empty string
    const expected =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    expect(verifyChecksum(data, expected)).toBe(true);
  });
});

describe("computeChecksum", () => {
  it("computes correct SHA256 for known input", () => {
    const data = Buffer.from("hello world");
    const expected =
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";

    expect(computeChecksum(data)).toBe(expected);
  });

  it("computes correct SHA256 for empty buffer", () => {
    const data = Buffer.from("");
    const expected =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    expect(computeChecksum(data)).toBe(expected);
  });
});

describe("resolvePluginPath", () => {
  const home = homedir();

  it("resolves VST3 user path", () => {
    expect(resolvePluginPath("vst3", "user")).toBe(
      join(home, "Library/Audio/Plug-Ins/VST3"),
    );
  });

  it("resolves VST3 system path", () => {
    expect(resolvePluginPath("vst3", "system")).toBe(
      "/Library/Audio/Plug-Ins/VST3",
    );
  });

  it("resolves AU user path", () => {
    expect(resolvePluginPath("au", "user")).toBe(
      join(home, "Library/Audio/Plug-Ins/Components"),
    );
  });

  it("resolves AU system path", () => {
    expect(resolvePluginPath("au", "system")).toBe(
      "/Library/Audio/Plug-Ins/Components",
    );
  });

  it("resolves CLAP user path", () => {
    expect(resolvePluginPath("clap", "user")).toBe(
      join(home, "Library/Audio/Plug-Ins/CLAP"),
    );
  });

  it("resolves CLAP system path", () => {
    expect(resolvePluginPath("clap", "system")).toBe(
      "/Library/Audio/Plug-Ins/CLAP",
    );
  });
});
