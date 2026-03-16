import { describe, expect, it } from "vitest";
import { parsePluginRef } from "./parse-plugin-ref.js";

describe("parsePluginRef", () => {
  it("parses a plain plugin name", () => {
    const ref = parsePluginRef("surge-xt");
    expect(ref.name).toBe("surge-xt");
    expect(ref.version).toBeUndefined();
  });

  it("parses name@version", () => {
    const ref = parsePluginRef("surge-xt@1.3.1");
    expect(ref.name).toBe("surge-xt");
    expect(ref.version).toBe("1.3.1");
  });

  it("handles version with dots", () => {
    const ref = parsePluginRef("dexed@1.0.1");
    expect(ref.name).toBe("dexed");
    expect(ref.version).toBe("1.0.1");
  });

  it("uses last @ for scoped-like names", () => {
    const ref = parsePluginRef("plugin@2.0");
    expect(ref.name).toBe("plugin");
    expect(ref.version).toBe("2.0");
  });
});
