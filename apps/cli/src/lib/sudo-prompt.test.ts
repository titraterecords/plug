import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPermissionError } from "./sudo-prompt.js";

const isWin = process.platform === "win32";

describe("isPermissionError", () => {
  // CI runners often have admin/root privileges, so we can't reliably
  // trigger permission errors there. Skip when running as admin.
  const isRoot = isWin ? false : process.getuid?.() === 0;

  it.skipIf(isRoot)("returns true for a real EACCES filesystem error", () => {
    try {
      // /etc/hosts is readable but not writable without sudo
      writeFileSync("/etc/hosts", "");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(isPermissionError(err)).toBe(true);
    }
  });

  it.skipIf(isWin)("returns false for a real ENOENT filesystem error", () => {
    try {
      writeFileSync("/nonexistent-dir-abc123/file.txt", "");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(isPermissionError(err)).toBe(false);
    }
  });

  it("recognises EACCES error code", () => {
    const err = Object.assign(new Error("permission denied"), { code: "EACCES" });
    expect(isPermissionError(err)).toBe(true);
  });

  it("recognises EPERM error code", () => {
    const err = Object.assign(new Error("operation not permitted"), { code: "EPERM" });
    expect(isPermissionError(err)).toBe(true);
  });

  it("returns false for non-error values", () => {
    expect(isPermissionError("EACCES")).toBe(false);
    expect(isPermissionError(null)).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
  });
});
