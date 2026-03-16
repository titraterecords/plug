import { homedir } from "node:os";
import { join } from "node:path";
import type { PluginFormat } from "@titrate/registry-schema/schema";

type InstallTarget = "user" | "system";

// PLUG_HOME overrides all derived paths - used for e2e testing and custom installs
const PLUG_HOME = process.env.PLUG_HOME;
const IS_CUSTOM_HOME = Boolean(PLUG_HOME);
const HOME_DIR = PLUG_HOME ?? join(homedir(), ".plug");

const PLUGIN_PATHS: Record<PluginFormat, Record<InstallTarget, string>> =
  IS_CUSTOM_HOME
    ? {
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
      }
    : {
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
  "https://raw.githubusercontent.com/titraterecords/plug/main/registry.json";
const CACHE_DIR = HOME_DIR;
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
