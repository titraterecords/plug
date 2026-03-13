import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginFormat } from "@plug/registry-schema/schema";

type InstallTarget = "user" | "system";

const PLUGIN_PATHS: Record<PluginFormat, Record<InstallTarget, string>> = {
  vst3: {
    user: join(homedir(), "Library/Audio/Plug-Ins/VST3"),
    system: "/Library/Audio/Plug-Ins/VST3",
  },
  au: {
    user: join(homedir(), "Library/Audio/Plug-Ins/Components"),
    system: "/Library/Audio/Plug-Ins/Components",
  },
  clap: {
    user: join(homedir(), "Library/Audio/Plug-Ins/CLAP"),
    system: "/Library/Audio/Plug-Ins/CLAP",
  },
};

// Preference order when no format is specified
const FORMAT_PREFERENCE: PluginFormat[] = ["vst3", "au", "clap"];

const REGISTRY_URL =
  "https://raw.githubusercontent.com/titraterecords/plug/main/tap/registry.json";
const CACHE_DIR = join(homedir(), ".plug");
const REGISTRY_CACHE_PATH = join(CACHE_DIR, "registry.json");
const INSTALLED_PATH = join(CACHE_DIR, "installed.json");
const VERSION_CACHE_PATH = join(CACHE_DIR, "version-check.json");

export {
  CACHE_DIR,
  FORMAT_PREFERENCE,
  INSTALLED_PATH,
  PLUGIN_PATHS,
  REGISTRY_CACHE_PATH,
  REGISTRY_URL,
  VERSION_CACHE_PATH,
};
export type { InstallTarget };
