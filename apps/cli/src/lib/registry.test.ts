import { describe, expect, it } from "vitest";
import type { Registry } from "@titrate/registry-schema/schema";
import { availableFormats, findPlugin, searchPlugins } from "./registry.js";

const VALID_SHA =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const testRegistry: Registry = {
  version: "2",
  updated: "2026-03-16",
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
      tags: ["effect", "compressor", "multiband", "dynamics"],
      homepage: "https://xferrecords.com/freeware",
      versions: {
        "1.37": {
          formats: {
            vst3: {
              mac: {
                url: "https://xferrecords.com/downloads/OTT.zip",
                sha256: VALID_SHA,
                artifact: "OTT.vst3",
              },
            },
            au: {
              mac: {
                url: "https://xferrecords.com/downloads/OTT.zip",
                sha256: VALID_SHA,
                artifact: "OTT.component",
              },
            },
          },
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
      tags: ["instrument", "synthesizer", "wavetable"],
      homepage: "https://vital.audio",
      versions: {
        "1.5.5": {
          formats: {
            vst3: {
              mac: {
                url: "https://vital.audio/releases/Vital-mac.zip",
                sha256: VALID_SHA,
                artifact: "Vital.vst3",
              },
              linux: {
                url: "https://vital.audio/releases/Vital-linux.zip",
                sha256: VALID_SHA,
                artifact: "Vital.vst3",
              },
            },
            clap: {
              mac: {
                url: "https://vital.audio/releases/Vital-mac.zip",
                sha256: VALID_SHA,
                artifact: "Vital.clap",
              },
            },
          },
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
      tags: ["effect", "reverb", "open-source"],
      homepage: "https://michaelwillis.github.io/dragonfly-reverb",
      versions: {
        "3.2.10": {
          formats: {
            vst3: {
              linux: {
                url: "https://example.com/dragonfly-linux.zip",
                sha256: VALID_SHA,
                artifact: "DragonflyRoomReverb.vst3",
              },
            },
            lv2: {
              linux: {
                url: "https://example.com/dragonfly-linux.zip",
                sha256: VALID_SHA,
                artifact: "DragonflyRoomReverb.lv2",
              },
            },
          },
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

describe("availableFormats", () => {
  it("returns formats available on mac", () => {
    const plugin = findPlugin(testRegistry, "ott")!;
    const formats = availableFormats(plugin, "mac");
    expect(formats).toStrictEqual(["vst3", "au"]);
  });

  it("returns empty for platform with no downloads", () => {
    const plugin = findPlugin(testRegistry, "ott")!;
    const formats = availableFormats(plugin, "linux");
    expect(formats).toStrictEqual([]);
  });

  it("returns cross-platform formats correctly", () => {
    const plugin = findPlugin(testRegistry, "vital")!;
    expect(availableFormats(plugin, "mac")).toStrictEqual(["vst3", "clap"]);
    expect(availableFormats(plugin, "linux")).toStrictEqual(["vst3"]);
  });

  it("returns linux-only formats", () => {
    const plugin = findPlugin(testRegistry, "dragonfly-reverb")!;
    expect(availableFormats(plugin, "linux")).toStrictEqual(["vst3", "lv2"]);
    expect(availableFormats(plugin, "mac")).toStrictEqual([]);
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

  it("matches by tag", () => {
    const results = searchPlugins(testRegistry, "wavetable");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("vital");
  });

  it("matches tag 'dynamics' across plugins", () => {
    const results = searchPlugins(testRegistry, "dynamics");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ott");
  });

  it("returns empty array for no matches", () => {
    const results = searchPlugins(testRegistry, "nonexistent");
    expect(results).toHaveLength(0);
  });

  it("filters by category option", () => {
    const results = searchPlugins(testRegistry, "wavetable", {
      category: "synthesizer",
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("vital");
  });

  it("filters by format and platform", () => {
    const results = searchPlugins(testRegistry, "dragonfly", {
      format: "lv2",
      platform: "linux",
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("dragonfly-reverb");
  });

  it("excludes plugins without format on platform", () => {
    const results = searchPlugins(testRegistry, "dragonfly", {
      format: "lv2",
      platform: "mac",
    });
    expect(results).toHaveLength(0);
  });
});
