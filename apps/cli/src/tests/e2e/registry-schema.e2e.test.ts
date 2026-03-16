import { describe, expect, it } from "vitest";
import { RegistrySchema } from "@titrate/registry-schema/schema";
import { REGISTRY_URL } from "../../constants.js";

// Validates that the live remote registry parses against the current Zod schema.
// Catches schema-vs-registry mismatches before publishing a new binary.
describe("e2e: remote registry schema validation", () => {
  it("fetches and parses the live registry without Zod errors", async () => {
    const response = await fetch(REGISTRY_URL);
    expect(response.ok).toBe(true);

    const data = await response.json();
    const registry = RegistrySchema.parse(data);

    expect(registry.plugins.length).toBeGreaterThanOrEqual(1);
  });

  it("contains the known plugin 'ott'", async () => {
    const response = await fetch(REGISTRY_URL);
    const data = await response.json();
    const registry = RegistrySchema.parse(data);

    const ott = registry.plugins.find((p) => p.id === "ott");
    expect(ott).toBeDefined();
    expect(ott!.name).toBe("OTT");
  });
});
