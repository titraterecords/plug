import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import {
  loadInstalled,
  markInstalled,
  markUninstalled,
  saveInstalled,
} from "./state.js";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

const mockedReadFile = vi.mocked(readFile);
const mockedWriteFile = vi.mocked(writeFile);
const mockedMkdir = vi.mocked(mkdir);

beforeEach(() => {
  vi.clearAllMocks();
  mockedMkdir.mockResolvedValue(undefined);
  mockedWriteFile.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadInstalled", () => {
  it("returns empty object when file does not exist", async () => {
    mockedReadFile.mockRejectedValue(new Error("ENOENT"));

    const result = await loadInstalled();
    expect(result).toStrictEqual({});
  });

  it("parses valid installed state", async () => {
    const state = {
      ott: {
        version: "1.37",
        formats: {
          vst3: "/Users/test/Library/Audio/Plug-Ins/VST3/OTT.vst3",
        },
        installedAt: "2026-03-13T00:00:00.000Z",
      },
    };
    mockedReadFile.mockResolvedValue(JSON.stringify(state));

    const result = await loadInstalled();
    expect(result.ott.version).toBe("1.37");
    expect(result.ott.formats.vst3).toBe(
      "/Users/test/Library/Audio/Plug-Ins/VST3/OTT.vst3",
    );
  });
});

describe("saveInstalled", () => {
  it("creates cache directory and writes state", async () => {
    const state = {
      ott: {
        version: "1.37",
        formats: { vst3: "/path/to/OTT.vst3" },
        installedAt: "2026-03-13T00:00:00.000Z",
      },
    };

    await saveInstalled(state);

    expect(mockedMkdir).toHaveBeenCalledOnce();
    expect(mockedWriteFile).toHaveBeenCalledOnce();
    const written = JSON.parse(mockedWriteFile.mock.calls[0][1] as string);
    expect(written.ott.version).toBe("1.37");
  });
});

describe("markInstalled", () => {
  it("adds a new plugin to empty state", async () => {
    mockedReadFile.mockRejectedValue(new Error("ENOENT"));

    await markInstalled("ott", "1.37", "vst3", "/path/to/OTT.vst3");

    expect(mockedWriteFile).toHaveBeenCalledOnce();
    const written = JSON.parse(mockedWriteFile.mock.calls[0][1] as string);
    expect(written.ott.version).toBe("1.37");
    expect(written.ott.formats.vst3).toBe("/path/to/OTT.vst3");
    expect(written.ott.installedAt).toBeDefined();
  });

  it("adds a format to an existing plugin", async () => {
    const existing = {
      ott: {
        version: "1.37",
        formats: { vst3: "/path/to/OTT.vst3" },
        installedAt: "2026-03-13T00:00:00.000Z",
      },
    };
    mockedReadFile.mockResolvedValue(JSON.stringify(existing));

    await markInstalled("ott", "1.37", "au", "/path/to/OTT.component");

    const written = JSON.parse(mockedWriteFile.mock.calls[0][1] as string);
    expect(written.ott.formats.vst3).toBe("/path/to/OTT.vst3");
    expect(written.ott.formats.au).toBe("/path/to/OTT.component");
  });
});

describe("markUninstalled", () => {
  it("removes a plugin from state", async () => {
    const existing = {
      ott: {
        version: "1.37",
        formats: { vst3: "/path/to/OTT.vst3" },
        installedAt: "2026-03-13T00:00:00.000Z",
      },
      vital: {
        version: "1.5.5",
        formats: { vst3: "/path/to/Vital.vst3" },
        installedAt: "2026-03-13T00:00:00.000Z",
      },
    };
    mockedReadFile.mockResolvedValue(JSON.stringify(existing));

    await markUninstalled("ott");

    const written = JSON.parse(mockedWriteFile.mock.calls[0][1] as string);
    expect(written.ott).toBeUndefined();
    expect(written.vital.version).toBe("1.5.5");
  });
});
