import { describe, expect, it } from "vitest";
import {
  FormatEntrySchema,
  PluginSchema,
  RegistrySchema,
} from "./schema.js";

const VALID_SHA =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

describe("FormatEntrySchema", () => {
  it("accepts a valid format entry", () => {
    const result = FormatEntrySchema.parse({
      url: "https://example.com/plugin.zip",
      sha256: VALID_SHA,
      artifact: "Plugin.vst3",
    });

    expect(result.url).toBe("https://example.com/plugin.zip");
    expect(result.sha256).toBe(VALID_SHA);
    expect(result.artifact).toBe("Plugin.vst3");
  });

  it("rejects an invalid URL", () => {
    expect(() =>
      FormatEntrySchema.parse({
        url: "not-a-url",
        sha256: VALID_SHA,
        artifact: "Plugin.vst3",
      }),
    ).toThrow();
  });

  it("accepts an empty sha256 for entries without a computed checksum", () => {
    const result = FormatEntrySchema.parse({
      url: "https://example.com/plugin.zip",
      sha256: "",
      artifact: "Plugin.vst3",
    });
    expect(result.sha256).toBe("");
  });

  it("rejects a sha256 that is too short", () => {
    expect(() =>
      FormatEntrySchema.parse({
        url: "https://example.com/plugin.zip",
        sha256: "abc123",
        artifact: "Plugin.vst3",
      }),
    ).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() =>
      FormatEntrySchema.parse({ url: "https://example.com" }),
    ).toThrow();
  });
});

describe("PluginSchema", () => {
  const validPlugin = {
    id: "ott",
    name: "OTT",
    author: "Xfer Records",
    description: "Multiband compressor",
    version: "1.37",
    license: "freeware",
    category: "compressor",
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
        },
      },
    },
  };

  it("accepts a valid plugin", () => {
    const result = PluginSchema.parse(validPlugin);
    expect(result.id).toBe("ott");
    expect(result.name).toBe("OTT");
    expect(result.category).toBe("compressor");
    expect(Object.keys(result.versions["1.37"].formats)).toStrictEqual([
      "vst3",
    ]);
  });

  it("accepts a plugin with tags", () => {
    const result = PluginSchema.parse({
      ...validPlugin,
      tags: ["effect", "compressor", "multiband"],
    });
    expect(result.tags).toStrictEqual(["effect", "compressor", "multiband"]);
  });

  it("accepts a plugin without tags", () => {
    const result = PluginSchema.parse(validPlugin);
    expect(result.tags).toBeUndefined();
  });

  it("accepts a plugin with multiple formats and platforms", () => {
    const result = PluginSchema.parse({
      ...validPlugin,
      versions: {
        "1.37": {
          formats: {
            vst3: {
              mac: {
                url: "https://example.com/mac.zip",
                sha256: VALID_SHA,
                artifact: "OTT.vst3",
              },
              win: {
                url: "https://example.com/win.zip",
                sha256: VALID_SHA,
                artifact: "OTT.vst3",
              },
            },
            au: {
              mac: {
                url: "https://example.com/mac.zip",
                sha256: VALID_SHA,
                artifact: "OTT.component",
              },
            },
          },
        },
      },
    });

    const formats = result.versions["1.37"].formats;
    expect(Object.keys(formats)).toStrictEqual(["vst3", "au"]);
    expect(Object.keys(formats.vst3!)).toStrictEqual(["mac", "win"]);
    expect(Object.keys(formats.au!)).toStrictEqual(["mac"]);
  });

  it("accepts a plugin with multiple versions", () => {
    const result = PluginSchema.parse({
      ...validPlugin,
      versions: {
        "1.37": {
          date: "2024-06-01",
          formats: validPlugin.versions["1.37"].formats,
        },
        "1.36": {
          date: "2024-01-15",
          formats: validPlugin.versions["1.37"].formats,
        },
      },
    });

    expect(Object.keys(result.versions)).toStrictEqual(["1.37", "1.36"]);
    expect(result.versions["1.37"].date).toBe("2024-06-01");
  });

  it("rejects empty id", () => {
    expect(() => PluginSchema.parse({ ...validPlugin, id: "" })).toThrow();
  });

  it("rejects invalid homepage URL", () => {
    expect(() =>
      PluginSchema.parse({ ...validPlugin, homepage: "not-a-url" }),
    ).toThrow();
  });
});

describe("RegistrySchema", () => {
  it("accepts a valid registry", () => {
    const result = RegistrySchema.parse({
      version: "2",
      updated: "2026-03-16",
      plugins: [
        {
          id: "ott",
          name: "OTT",
          author: "Xfer Records",
          description: "Multiband compressor",
          version: "1.37",
          license: "freeware",
          category: "compressor",
          homepage: "https://xferrecords.com/freeware",
          versions: {
            "1.37": {
              formats: {
                vst3: {
                  mac: {
                    url: "https://xferrecords.com/downloads/OTT.zip",
                    sha256:
                      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                    artifact: "OTT.vst3",
                  },
                },
              },
            },
          },
        },
      ],
    });

    expect(result.version).toBe("2");
    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0].id).toBe("ott");
  });

  it("accepts an empty plugins array", () => {
    const result = RegistrySchema.parse({
      version: "2",
      updated: "2026-03-16",
      plugins: [],
    });

    expect(result.plugins).toHaveLength(0);
  });

  it("rejects missing version", () => {
    expect(() =>
      RegistrySchema.parse({ updated: "2026-03-16", plugins: [] }),
    ).toThrow();
  });
});
