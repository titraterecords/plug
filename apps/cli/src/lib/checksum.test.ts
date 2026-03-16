import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { computeChecksum, verifyChecksum } from "./checksum.js";

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
    const expected =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    expect(verifyChecksum(data, expected)).toBe(true);
  });
});

describe("computeChecksum", () => {
  it("computes correct SHA256 for known input", () => {
    const data = Buffer.from("hello world");
    expect(computeChecksum(data)).toBe(
      "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    );
  });

  it("computes correct SHA256 for empty buffer", () => {
    const data = Buffer.from("");
    expect(computeChecksum(data)).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});
