import { describe, expect, it } from "vitest";
import { currentPlatform } from "./platform.js";

describe("currentPlatform", () => {
  it("returns a valid platform for the current OS", () => {
    const platform = currentPlatform();
    expect(["mac", "win", "linux"]).toContain(platform);
  });

  it.skipIf(process.platform !== "darwin")("returns mac on darwin", () => {
    expect(currentPlatform()).toBe("mac");
  });

  it.skipIf(process.platform !== "linux")("returns linux on linux", () => {
    expect(currentPlatform()).toBe("linux");
  });

  it.skipIf(process.platform !== "win32")("returns win on windows", () => {
    expect(currentPlatform()).toBe("win");
  });
});
