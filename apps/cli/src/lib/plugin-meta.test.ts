import { describe, expect, it } from "vitest";
import type { Plugin } from "@titrate/registry-schema/schema";
import { pluginDescription, pluginTags } from "./plugin-meta.js";

const VALID_SHA =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const pluginWithMeta: Plugin = {
  id: "ott",
  name: "OTT",
  author: "Xfer Records",
  description: "Multiband compressor",
  version: "1.37",
  license: "freeware",
  category: "compressor",
  homepage: "https://xferrecords.com/freeware",
  meta: {
    en: {
      description: "Multiband compressor",
      tags: ["compressor", "dynamics"],
    },
    de: {
      description: "Multiband-Kompressor",
      tags: ["Kompressor", "Dynamik"],
    },
    ja: {
      description: "マルチバンドコンプレッサー",
    },
  },
  versions: {
    "1.37": {
      formats: {
        vst3: {
          mac: {
            url: "https://example.com/ott.zip",
            sha256: VALID_SHA,
            artifact: "OTT.vst3",
          },
        },
      },
    },
  },
};

const pluginWithoutMeta: Plugin = {
  id: "vital",
  name: "Vital",
  author: "Matt Tytel",
  description: "Spectral warping wavetable synthesizer",
  version: "1.5.5",
  license: "freeware",
  category: "synthesizer",
  tags: ["instrument", "synthesizer"],
  homepage: "https://vital.audio",
  versions: {
    "1.5.5": {
      formats: {
        vst3: {
          mac: {
            url: "https://vital.audio/v.zip",
            sha256: VALID_SHA,
            artifact: "Vital.vst3",
          },
        },
      },
    },
  },
};

describe("pluginDescription", () => {
  it("returns locale-specific description", () => {
    expect(pluginDescription(pluginWithMeta, "de")).toBe(
      "Multiband-Kompressor",
    );
  });

  it("falls back to en for unknown locale", () => {
    expect(pluginDescription(pluginWithMeta, "ko")).toBe(
      "Multiband compressor",
    );
  });

  it("returns root description when no meta", () => {
    expect(pluginDescription(pluginWithoutMeta, "de")).toBe(
      "Spectral warping wavetable synthesizer",
    );
  });
});

describe("pluginTags", () => {
  it("returns locale-specific tags", () => {
    expect(pluginTags(pluginWithMeta, "de")).toStrictEqual([
      "Kompressor",
      "Dynamik",
    ]);
  });

  it("falls back to en tags for locale without tags", () => {
    expect(pluginTags(pluginWithMeta, "ja")).toStrictEqual([
      "compressor",
      "dynamics",
    ]);
  });

  it("falls back to en for unknown locale", () => {
    expect(pluginTags(pluginWithMeta, "ko")).toStrictEqual([
      "compressor",
      "dynamics",
    ]);
  });

  it("returns root tags when no meta", () => {
    expect(pluginTags(pluginWithoutMeta, "de")).toStrictEqual([
      "instrument",
      "synthesizer",
    ]);
  });
});
