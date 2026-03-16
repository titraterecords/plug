import { homedir } from "node:os";
import { join } from "node:path";
import type { Platform, PluginFormat } from "@titrate/registry-schema/schema";

type InstallTarget = "user" | "system";

// PLUG_HOME overrides all derived paths - used for e2e testing and custom installs
const PLUG_HOME = process.env.PLUG_HOME;
const IS_CUSTOM_HOME = Boolean(PLUG_HOME);
const HOME_DIR = PLUG_HOME ?? join(homedir(), ".plug");

type PluginPaths = Record<PluginFormat, Record<InstallTarget, string>>;

// When PLUG_HOME is set, all formats install to subdirectories under it.
// Used for e2e testing and custom installs.
const CUSTOM_PATHS: PluginPaths = {
  vst3: {
    user: join(HOME_DIR, "plugins/vst3"),
    system: join(HOME_DIR, "plugins/vst3"),
  },
  au: {
    user: join(HOME_DIR, "plugins/au"),
    system: join(HOME_DIR, "plugins/au"),
  },
  clap: {
    user: join(HOME_DIR, "plugins/clap"),
    system: join(HOME_DIR, "plugins/clap"),
  },
  lv2: {
    user: join(HOME_DIR, "plugins/lv2"),
    system: join(HOME_DIR, "plugins/lv2"),
  },
};

const MAC_PATHS: PluginPaths = {
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
  lv2: {
    user: join(homedir(), "Library/Audio/Plug-Ins/LV2"),
    system: "/Library/Audio/Plug-Ins/LV2",
  },
};

// Standard Linux paths per Steinberg VST3 spec, CLAP spec, and LV2 spec.
// AU doesn't exist on Linux - paths are placeholders to satisfy the type.
const LINUX_PATHS: PluginPaths = {
  vst3: {
    user: join(homedir(), ".vst3"),
    system: "/usr/lib/vst3",
  },
  au: {
    user: "",
    system: "",
  },
  clap: {
    user: join(homedir(), ".clap"),
    system: "/usr/lib/clap",
  },
  lv2: {
    user: join(homedir(), ".lv2"),
    system: "/usr/lib/lv2",
  },
};

// AU and LV2 don't exist on Windows - paths are placeholders to satisfy the type.
const WIN_PATHS: PluginPaths = {
  vst3: {
    user: join(
      process.env.LOCALAPPDATA ?? "",
      "Programs/Common/VST3",
    ),
    system: "C:\\Program Files\\Common Files\\VST3",
  },
  au: {
    user: "",
    system: "",
  },
  clap: {
    user: join(
      process.env.LOCALAPPDATA ?? "",
      "Programs/Common/CLAP",
    ),
    system: "C:\\Program Files\\Common Files\\CLAP",
  },
  lv2: {
    user: "",
    system: "",
  },
};

const PLATFORM_PATHS: Record<Platform, PluginPaths> = {
  mac: MAC_PATHS,
  linux: LINUX_PATHS,
  win: WIN_PATHS,
};

function pluginPaths(platform: Platform): PluginPaths {
  if (IS_CUSTOM_HOME) return CUSTOM_PATHS;
  return PLATFORM_PATHS[platform];
}

// Install order when no --format flag is given.
// Only formats that actually exist on each platform are listed.
const FORMAT_PREFERENCE: Record<Platform, PluginFormat[]> = {
  mac: ["vst3", "au", "clap"],
  linux: ["vst3", "clap", "lv2"],
  win: ["vst3", "clap"],
};

const REGISTRY_URL =
  "https://raw.githubusercontent.com/titraterecords/plug/main/registry.json";
const CACHE_DIR = HOME_DIR;
const REGISTRY_CACHE_PATH = join(CACHE_DIR, "registry.json");
const INSTALLED_PATH = join(CACHE_DIR, "installed.json");
const VERSION_CACHE_PATH = join(CACHE_DIR, "version-check.json");

export {
  CACHE_DIR,
  FORMAT_PREFERENCE,
  INSTALLED_PATH,
  REGISTRY_CACHE_PATH,
  REGISTRY_URL,
  VERSION_CACHE_PATH,
  pluginPaths,
};
export type { InstallTarget };
