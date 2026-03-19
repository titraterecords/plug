import { describe, expect, it } from "vitest";
import type { Registry } from "@titrate/registry-schema/schema";
import { searchPlugins } from "./search-plugins.js";

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
      meta: {
        en: {
          description:
            "Multiband upward/downward compressor, popular in electronic music",
          tags: ["effect", "compressor", "multiband", "dynamics"],
        },
        de: {
          description:
            "Multiband-Kompressor, beliebt in elektronischer Musik",
          tags: ["Effekt", "Kompressor", "Multiband", "Dynamik"],
        },
        ja: {
          description: "マルチバンドコンプレッサー、電子音楽で人気",
          tags: ["エフェクト", "コンプレッサー"],
        },
      },
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

  it("filters by format and os", () => {
    const results = searchPlugins(testRegistry, "dragonfly", {
      format: "lv2",
      os: "linux",
    });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("dragonfly-reverb");
  });

  it("excludes plugins without format on os", () => {
    const results = searchPlugins(testRegistry, "dragonfly", {
      format: "lv2",
      os: "mac",
    });
    expect(results).toHaveLength(0);
  });

  it("matches German description via meta", () => {
    const results = searchPlugins(testRegistry, "Kompressor");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ott");
  });

  it("matches Japanese tags via meta", () => {
    const results = searchPlugins(testRegistry, "コンプレッサー");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ott");
  });

  it("matches English meta alongside root fields", () => {
    const results = searchPlugins(testRegistry, "compressor");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("ott");
  });

  it("matches root description for plugins without meta", () => {
    const results = searchPlugins(testRegistry, "wavetable");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("vital");
  });
});
