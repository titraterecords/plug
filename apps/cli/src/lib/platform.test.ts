import { describe, expect, it } from "vitest";
import { currentPlatform } from "./platform.js";

describe("currentPlatform", () => {
  it("returns a valid platform for the current OS", () => {
    const platform = currentPlatform();
    expect(["mac", "win", "linux"]).toContain(platform);
  });

  it("returns mac on darwin", () => {
    // This test only runs on macOS
    if (process.platform !== "darwin") return;
    expect(currentPlatform()).toBe("mac");
  });

  it("returns linux on linux", () => {
    if (process.platform !== "linux") return;
    expect(currentPlatform()).toBe("linux");
  });
});
