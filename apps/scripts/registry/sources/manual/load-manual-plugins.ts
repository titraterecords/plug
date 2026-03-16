import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Platform } from "@titrate/registry-schema/schema";

interface PlatformDownload {
  url: string;
  // Known artifact filenames - used as fallback when scan can't extract
  // (e.g. Windows exe installers that contain .vst3 but aren't extractable)
  artifacts: string[];
}

interface ManualPlugin {
  id: string;
  name: string;
  author: string;
  description: string;
  version: string;
  license: string;
  category: string;
  tags: string[];
  homepage: string;
  downloads: Partial<Record<Platform, PlatformDownload>>;
}

const PLUGINS_PATH = join(import.meta.dirname, "plugins.json");

async function loadManualPlugins(): Promise<ManualPlugin[]> {
  const data = await readFile(PLUGINS_PATH, "utf-8");
  return JSON.parse(data) as ManualPlugin[];
}

export { loadManualPlugins };
export type { ManualPlugin, PlatformDownload };
