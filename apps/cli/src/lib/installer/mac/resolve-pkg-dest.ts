import { homedir } from "node:os";
import { join } from "node:path";
import type { InstallTarget } from "../../../constants.js";

// Paths that can safely install under ~/Library/ for user target.
// Application Support stays at system /Library/ because plugins hardcode
// those paths (e.g. Cardinal expects /Library/Application Support/Cardinal/).
// Presets are rewritable because DAWs scan both system and user preset folders.
const USER_REWRITABLE = [
  "/Library/Audio/Plug-Ins/",
  "/Library/Audio/Presets/",
];

// Resolves where a PKG sub-package's contents should be installed.
// PLUG_HOME: prepend to original path (true mirror for testing).
// Real install: plugin binaries go to ~/Library for user target,
// resources stay at system /Library/ because plugins expect them there.
function resolvePkgDest(installLocation: string, target: InstallTarget): string {
  const normalized = installLocation.replace(/\/$/, "");
  const plugHome = process.env.PLUG_HOME;

  if (plugHome) {
    return join(plugHome, normalized.replace(/^\//, ""));
  }

  // Only rewrite plugin paths to ~/Library, not resources
  if (target === "user") {
    const isPluginPath = USER_REWRITABLE.some((p) => normalized.startsWith(p));
    if (isPluginPath) {
      return join(homedir(), normalized.slice(1));
    }
  }

  return normalized;
}

export { resolvePkgDest };
