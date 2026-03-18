import { homedir } from "node:os";
import { join } from "node:path";
import type { InstallTarget } from "../../../constants.js";

// Maps macOS system plugin paths to their format subdirectory under PLUG_HOME
const FORMAT_DIR_MAP: Record<string, string> = {
  "/Library/Audio/Plug-Ins/VST3": "plugins/vst3",
  "/Library/Audio/Plug-Ins/Components": "plugins/au",
  "/Library/Audio/Plug-Ins/CLAP": "plugins/clap",
  "/Library/Audio/Plug-Ins/LV2": "plugins/lv2",
  "/Library/Audio/Plug-Ins/VST": "plugins/vst2",
};

// Resolves where a PKG sub-package's contents should actually be copied to.
// When PLUG_HOME is set, everything goes under that directory tree for
// testing isolation. Otherwise, user-target installs use ~/Library paths.
// Reads PLUG_HOME at call time so tests can stub the env var.
function resolvePkgDest(installLocation: string, target: InstallTarget): string {
  const normalized = installLocation.replace(/\/$/, "");
  const plugHome = process.env.PLUG_HOME;

  if (plugHome) {
    return resolvePkgDestCustomHome(normalized, plugHome);
  }

  return resolvePkgDestReal(normalized, target);
}

function resolvePkgDestCustomHome(path: string, plugHome: string): string {
  for (const [prefix, dir] of Object.entries(FORMAT_DIR_MAP)) {
    if (path.startsWith(prefix)) {
      const suffix = path.slice(prefix.length);
      return join(plugHome, dir) + suffix;
    }
  }

  if (path.startsWith("/Library/Application Support/")) {
    const rest = path.slice("/Library/Application Support/".length);
    return join(plugHome, "support", rest);
  }

  if (path.startsWith("/Library/Audio/Presets/")) {
    const rest = path.slice("/Library/Audio/Presets/".length);
    return join(plugHome, "presets", rest);
  }

  if (path.startsWith("/Applications/")) {
    const rest = path.slice("/Applications/".length);
    return join(plugHome, "apps", rest);
  }

  return join(plugHome, "other", path.replace(/^\//, ""));
}

function resolvePkgDestReal(path: string, target: InstallTarget): string {
  const home = homedir();

  for (const [prefix] of Object.entries(FORMAT_DIR_MAP)) {
    if (path.startsWith(prefix)) {
      if (target === "user") {
        // /Library/... → ~/Library/...
        return join(home, path.slice(1));
      }
      return path;
    }
  }

  if (path.startsWith("/Library/Application Support/")) {
    if (target === "user") {
      return join(home, path.slice(1));
    }
    return path;
  }

  if (path.startsWith("/Library/Audio/Presets/")) {
    if (target === "user") {
      return join(home, path.slice(1));
    }
    return path;
  }

  // Apps always go to /Applications regardless of target
  if (path.startsWith("/Applications/")) return path;

  return path;
}

export { resolvePkgDest };
