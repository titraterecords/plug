import { homedir } from "node:os";
import { join } from "node:path";
import type { Platform, PluginFormat } from "@titrate/registry-schema/schema";
import { HOME_DIR, IS_CUSTOM_HOME } from "./home.js";

type InstallTarget = "user" | "system";

type PluginPaths = Record<PluginFormat, Record<InstallTarget, string>>;

// When PLUG_HOME is set, all formats install to subdirectories under it.
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

// Windows has no reliable per-user plugin path that DAWs scan.
// Both user and system targets install to the standard system path.
const WIN_PATHS: PluginPaths = {
  vst3: {
    user: "C:\\Program Files\\Common Files\\VST3",
    system: "C:\\Program Files\\Common Files\\VST3",
  },
  au: {
    user: "",
    system: "",
  },
  clap: {
    user: "C:\\Program Files\\Common Files\\CLAP",
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

export { pluginPaths };
export type { InstallTarget };
