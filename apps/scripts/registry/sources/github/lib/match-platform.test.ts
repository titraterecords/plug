import { describe, expect, it } from "vitest";
import { matchPlatform } from "./match-platform.js";

describe("matchPlatform", () => {
  it("matches macOS variants", () => {
    expect(matchPlatform("plugin-macOS.zip")).toBe("mac");
    expect(matchPlatform("Plugin-mac.dmg")).toBe("mac");
    expect(matchPlatform("plugin-osx-x64.zip")).toBe("mac");
    expect(matchPlatform("plugin-darwin-arm64.zip")).toBe("mac");
    expect(matchPlatform("Plugin-Mac.pkg")).toBe("mac");
  });

  it("matches Linux variants", () => {
    expect(matchPlatform("plugin-linux-x64.zip")).toBe("linux");
    expect(matchPlatform("Plugin-Linux.deb")).toBe("linux");
  });

  it("matches Windows variants", () => {
    expect(matchPlatform("plugin-windows-x64.zip")).toBe("win");
    expect(matchPlatform("Plugin-Win.exe")).toBe("win");
    expect(matchPlatform("plugin-win64.zip")).toBe("win");
    expect(matchPlatform("plugin-Windows.zip")).toBe("win");
  });

  it("skips source code archives", () => {
    expect(matchPlatform("Source code.tar.gz")).toBeNull();
    expect(matchPlatform("Source code.zip")).toBeNull();
  });

  it("returns null for unrecognized filenames", () => {
    expect(matchPlatform("README.md")).toBeNull();
    expect(matchPlatform("checksums.txt")).toBeNull();
  });

  it("allows platform-specific .tar.gz files", () => {
    expect(matchPlatform("plugin-linux.tar.gz")).toBe("linux");
  });
});
