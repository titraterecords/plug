import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPermissionError } from "./sudo-prompt.js";

const isWin = process.platform === "win32";

// Write-protected file that exists on each platform
const PROTECTED_FILE = isWin
  ? "C:\\Windows\\System32\\drivers\\etc\\hosts"
  : "/etc/hosts";

describe("isPermissionError", () => {
  it("returns true for a real EACCES filesystem error", () => {
    try {
      writeFileSync(PROTECTED_FILE, "");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(isPermissionError(err)).toBe(true);
    }
  });

  it("returns false for a real ENOENT filesystem error", () => {
    try {
      writeFileSync("/nonexistent-dir-abc123/file.txt", "");
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
