import { describe, expect, it } from "vitest";
import { FormatSchema, PluginSchema, RegistrySchema } from "../src/schema.js";

describe("FormatSchema", () => {
  it("accepts a valid format entry", () => {
    const result = FormatSchema.parse({
      url: "https://example.com/plugin.zip",
      sha256:
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      artifact: "Plugin.vst3",
    });

    expect(result.url).toBe("https://example.com/plugin.zip");
    expect(result.sha256).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(result.artifact).toBe("Plugin.vst3");
  });

  it("rejects an invalid URL", () => {
    expect(() =>
      FormatSchema.parse({
        url: "not-a-url",
        sha256:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        artifact: "Plugin.vst3",
      }),
    ).toThrow();
  });

  it("rejects a sha256 that is too short", () => {
    expect(() =>
      FormatSchema.parse({
        url: "https://example.com/plugin.zip",
        sha256: "abc123",
        artifact: "Plugin.vst3",
      }),
    ).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => FormatSchema.parse({ url: "https://example.com" })).toThrow();
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
    formats: {
      vst3: {
        url: "https://xferrecords.com/downloads/OTT.zip",
        sha256:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        artifact: "OTT.vst3",
      },
    },
  };

  it("accepts a valid plugin", () => {
    const result = PluginSchema.parse(validPlugin);
    expect(result.id).toBe("ott");
    expect(result.name).toBe("OTT");
    expect(result.category).toBe("compressor");
    expect(Object.keys(result.formats)).toStrictEqual(["vst3"]);
  });

  it("accepts a plugin with multiple formats", () => {
    const result = PluginSchema.parse({
      ...validPlugin,
      formats: {
        vst3: validPlugin.formats.vst3,
        au: {
          ...validPlugin.formats.vst3,
          artifact: "OTT.component",
        },
      },
    });

    expect(Object.keys(result.formats)).toStrictEqual(["vst3", "au"]);
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
      version: "1",
      updated: "2026-03-13",
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
          formats: {
            vst3: {
              url: "https://xferrecords.com/downloads/OTT.zip",
              sha256:
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
              artifact: "OTT.vst3",
            },
          },
        },
      ],
    });

    expect(result.version).toBe("1");
    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0].id).toBe("ott");
  });

  it("accepts an empty plugins array", () => {
    const result = RegistrySchema.parse({
      version: "1",
      updated: "2026-03-13",
      plugins: [],
    });

    expect(result.plugins).toHaveLength(0);
  });

  it("rejects missing version", () => {
    expect(() =>
      RegistrySchema.parse({ updated: "2026-03-13", plugins: [] }),
    ).toThrow();
  });
});
