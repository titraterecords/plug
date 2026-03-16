import { describe, expect, it } from "vitest";
import type { Plugin } from "@titrate/registry-schema/schema";
import { resolveVersion } from "./resolve-version.js";

const VALID_SHA =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const testPlugin: Plugin = {
  id: "surge-xt",
  name: "Surge XT",
  author: "Surge Synth Team",
  description: "Hybrid synthesizer",
  version: "1.3.4",
  license: "gpl-3.0",
  category: "synthesizer",
  homepage: "https://surge-synthesizer.github.io",
  versions: {
    "1.3.4": {
      date: "2024-08-11",
      formats: {
        vst3: {
          mac: {
            url: "https://example.com/1.3.4.zip",
            sha256: VALID_SHA,
            artifact: "Surge XT.vst3",
          },
        },
      },
    },
    "1.3.1": {
      date: "2024-03-02",
      formats: {
        vst3: {
          mac: {
            url: "https://example.com/1.3.1.zip",
            sha256: VALID_SHA,
            artifact: "Surge XT.vst3",
          },
        },
      },
    },
  },
};

describe("resolveVersion", () => {
  it("returns latest version when no version requested", () => {
    const entry = resolveVersion(testPlugin);
    expect(entry.date).toBe("2024-08-11");
  });

  it("returns specific version when requested", () => {
    const entry = resolveVersion(testPlugin, "1.3.1");
    expect(entry.date).toBe("2024-03-02");
  });

  it("throws for unknown version", () => {
    expect(() => resolveVersion(testPlugin, "9.9.9")).toThrow(
      'Version "9.9.9" not found for Surge XT. Available: 1.3.4, 1.3.1',
    );
  });
});
