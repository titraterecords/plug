import { describe, expect, it } from "vitest";
import { versionFromTag } from "./version-from-tag.js";

describe("versionFromTag", () => {
  it("strips the v prefix from a semver tag", () => {
    expect(versionFromTag("v1.3.4", "2026-02-13T00:00:00Z")).toBe("1.3.4");
  });

  it("returns a semver tag without prefix as-is", () => {
    expect(versionFromTag("1.0.1", "2026-02-13T00:00:00Z")).toBe("1.0.1");
  });

  it("handles two-segment versions", () => {
    expect(versionFromTag("v1.3", "2026-02-13T00:00:00Z")).toBe("1.3");
  });

  it("falls back to publish date for non-semver tags", () => {
    expect(versionFromTag("latest", "2026-02-13T10:30:00Z")).toBe(
      "2026.02.13",
    );
  });

  it("falls back to publish date for nightly tags", () => {
    expect(versionFromTag("nightly", "2025-12-01T08:00:00Z")).toBe(
      "2025.12.01",
    );
  });
});
