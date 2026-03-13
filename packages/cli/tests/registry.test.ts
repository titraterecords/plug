import { describe, expect, it } from "vitest";
import type { Registry } from "@plug/registry-schema/schema";
import { findPlugin, searchPlugins } from "../src/lib/registry.js";

const testRegistry: Registry = {
  version: "1",
  updated: "2026-03-13",
  plugins: [
    {
      id: "ott",
      name: "OTT",
      author: "Xfer Records",
      description:
        "Multiband upward/downward compressor, popular in electronic music",
      version: "1.37",
      license: "freeware",
      category: "compressor",
      homepage: "https://xferrecords.com/freeware",
      formats: {
        vst3: {
          url: "https://xferrecords.com/downloads/OTT.zip",
          sha256:
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          artifact: "OTT.vst3",
        },
        au: {
          url: "https://xferrecords.com/downloads/OTT.zip",
          sha256:
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          artifact: "OTT.component",
        },
      },
    },
    {
      id: "vital",
      name: "Vital",
      author: "Matt Tytel",
      description: "Spectral warping wavetable synthesizer",
      version: "1.5.5",
      license: "freeware",
      category: "synthesizer",
      homepage: "https://vital.audio",
      formats: {
        vst3: {
          url: "https://vital.audio/releases/Vital.zip",
          sha256:
            "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
          artifact: "Vital.vst3",
        },
        clap: {
          url: "https://vital.audio/releases/Vital.zip",
          sha256:
            "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
          artifact: "Vital.clap",
        },
      },
    },
    {
      id: "dragonfly-reverb",
      name: "Dragonfly Reverb",
      author: "Michael Willis",
      description: "Algorithmic reverb based on Freeverb3",
      version: "3.2.10",
      license: "gpl-3.0",
      category: "reverb",
      homepage: "https://michaelwillis.github.io/dragonfly-reverb",
      formats: {
        vst3: {
          url: "https://example.com/dragonfly.zip",
          sha256:
            "e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6",
          artifact: "DragonflyRoomReverb.vst3",
        },
      },
    },
  ],
};

describe("findPlugin", () => {
  it("finds a plugin by exact id", () => {
    const result = findPlugin(testRegistry, "ott");
    expect(result).toBeDefined();
    expect(result!.name).toBe("OTT");
    expect(result!.version).toBe("1.37");
  });

  it("returns undefined for unknown id", () => {
    const result = findPlugin(testRegistry, "nonexistent");
    expect(result).toBeUndefined();
  });

  it("does not match partial ids", () => {
    const result = findPlugin(testRegistry, "ot");
    expect(result).toBeUndefined();
  });
});

describe("searchPlugins", () => {
  it("matches by plugin id", () => {
    const results = searchPlugins(testRegistry, "ott");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ott");
  });

  it("matches by plugin name (case-insensitive)", () => {
    const results = searchPlugins(testRegistry, "Vital");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("vital");
  });

  it("matches by description keyword", () => {
    const results = searchPlugins(testRegistry, "compressor");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ott");
  });

  it("matches by category", () => {
    const results = searchPlugins(testRegistry, "synthesizer");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("vital");
  });

  it("matches multiple plugins for broad query", () => {
    // "reverb" appears in dragonfly-reverb's id, name, description, and category
    const results = searchPlugins(testRegistry, "reverb");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("dragonfly-reverb");
  });

  it("returns empty array for no matches", () => {
    const results = searchPlugins(testRegistry, "nonexistent");
    expect(results).toHaveLength(0);
  });

  it("filters by category option", () => {
    // "freeware" appears in description of multiple plugins,
    // but filtering by category "synthesizer" narrows results
    const results = searchPlugins(testRegistry, "wavetable", {
      category: "synthesizer",
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("vital");
  });

  it("filters by format option", () => {
    // Both ott and vital have vst3, only vital has clap
    const results = searchPlugins(testRegistry, "ott", { format: "clap" });
    expect(results).toHaveLength(0);
  });

  it("returns results that match both query and format", () => {
    const results = searchPlugins(testRegistry, "vital", { format: "clap" });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("vital");
  });
});
