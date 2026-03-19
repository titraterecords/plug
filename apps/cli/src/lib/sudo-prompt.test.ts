import { describe, expect, it } from "vitest";
import { isPermissionError } from "./sudo-prompt.js";

describe("isPermissionError", () => {
  it("returns true for EACCES errors", () => {
    const err = Object.assign(new Error("permission denied"), {
      code: "EACCES",
    });
    expect(isPermissionError(err)).toBe(true);
  });

  it("returns false for other error codes", () => {
    const err = Object.assign(new Error("not found"), { code: "ENOENT" });
    expect(isPermissionError(err)).toBe(false);
  });

  it("returns false for plain errors without code", () => {
    expect(isPermissionError(new Error("generic"))).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isPermissionError("EACCES")).toBe(false);
    expect(isPermissionError(null)).toBe(false);
  });
});
