import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPermissionError } from "./sudo-prompt.js";

describe("isPermissionError", () => {
  it("returns true for a real EACCES filesystem error", () => {
    try {
      // /etc/hosts is readable but not writable without sudo
      writeFileSync("/etc/hosts", "");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(isPermissionError(err)).toBe(true);
    }
  });

  it("returns false for a real ENOENT filesystem error", () => {
    try {
      writeFileSync("/nonexistent-dir/file.txt", "");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(isPermissionError(err)).toBe(false);
    }
  });

  it("returns false for non-error values", () => {
    expect(isPermissionError("EACCES")).toBe(false);
    expect(isPermissionError(null)).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
  });
});
