// Integration test against the real Granulator II .alp file.
// Downloads from roberthenke.com - skipped if network unavailable.

import { describe, expect, it } from "vitest";
import { extractAlp, isAlp } from "./extract-alp.js";

const ALP_URL =
  "https://www.roberthenke.com/files_software/free/M4LGranulatorII_r57382_v1.3.alp.zip";

async function downloadAndUnzip(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const zipData = Buffer.from(await response.arrayBuffer());

  // The .alp is inside a zip - extract it
  const { execSync } = await import("node:child_process");
  const { mkdtempSync, readFileSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const tmp = mkdtempSync(join(tmpdir(), "alp-test-"));
  const zipPath = join(tmp, "pack.zip");
  writeFileSync(zipPath, zipData);
  execSync(`unzip -o "${zipPath}" -d "${tmp}"`, { stdio: "ignore" });

  // Find the .alp file
  const { readdirSync } = await import("node:fs");
  const alpFile = readdirSync(tmp).find((f) => f.endsWith(".alp"));
  if (!alpFile) throw new Error("No .alp file found in zip");

  return readFileSync(join(tmp, alpFile));
}

describe("extractAlp (real file: Granulator II)", () => {
  let alpData: Buffer;

  it("downloads Granulator II .alp", async () => {
    alpData = await downloadAndUnzip(ALP_URL);
    expect(alpData.length).toBeGreaterThan(1_000_000);
  }, 30000);

  it("detects as valid .alp", () => {
    expect(isAlp(alpData)).toBe(true);
  });

  it("extracts 3 devices", () => {
    const devices = extractAlp(alpData);
    expect(devices).toHaveLength(3);
  });

  it("identifies 2 instruments and 1 audio effect", () => {
    const devices = extractAlp(alpData);
    const types = devices.map((d) => d.type);

    expect(types.filter((t) => t === "instrument")).toHaveLength(2);
    expect(types.filter((t) => t === "audio-effect")).toHaveLength(1);
  });

  it("each device starts with ampf marker", () => {
    const devices = extractAlp(alpData);
    for (const device of devices) {
      expect(device.data.subarray(0, 4).toString()).toBe("ampf");
    }
  });

  it("each device contains valid JSON patcher data", () => {
    const devices = extractAlp(alpData);
    for (const device of devices) {
      const str = device.data.toString("utf-8");
      const jsonStart = str.indexOf("{");
      expect(jsonStart).toBeGreaterThan(0);

      // Find the JSON body and verify it parses
      const jsonStr = str.slice(jsonStart);
      // The JSON may have binary footer, so find the matching closing brace
      let depth = 0;
      let end = 0;
      for (let i = 0; i < jsonStr.length; i++) {
        if (jsonStr[i] === "{") depth++;
        if (jsonStr[i] === "}") depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
      const parsed = JSON.parse(jsonStr.slice(0, end));
      expect(parsed.patcher).toBeDefined();
      expect(parsed.patcher.fileversion).toBe(1);
    }
  });
});
