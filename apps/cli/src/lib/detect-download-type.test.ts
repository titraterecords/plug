import { describe, expect, it } from "vitest";
import { detectDownloadType } from "./detect-download-type.js";

describe("detectDownloadType", () => {
  it("detects ZIP by PK magic bytes", () => {
    const data = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
    expect(detectDownloadType(data)).toBe("zip");
  });

  it("detects PKG by xar! magic bytes", () => {
    const data = Buffer.from([0x78, 0x61, 0x72, 0x21, 0x00]);
    expect(detectDownloadType(data)).toBe("pkg");
  });

  it("falls back to DMG for unknown magic bytes", () => {
    const data = Buffer.from([0x78, 0x9c, 0x00, 0x00, 0x00]);
    expect(detectDownloadType(data)).toBe("dmg");
  });
});
