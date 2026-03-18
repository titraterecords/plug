import { homedir } from "node:os";
import { join } from "node:path";
import type { InstallTarget } from "../../../constants.js";

// Resolves where a PKG sub-package's contents should be installed.
// PLUG_HOME: prepend it to the original path (true mirror of filesystem).
// Real install, user target: rewrite /Library/ to ~/Library/.
// Real install, system target: use the path as-is.
function resolvePkgDest(installLocation: string, target: InstallTarget): string {
  const normalized = installLocation.replace(/\/$/, "");
  const plugHome = process.env.PLUG_HOME;

  if (plugHome) {
    // True mirror: /Library/Audio/Plug-Ins/VST3 → $PLUG_HOME/Library/Audio/Plug-Ins/VST3
    return join(plugHome, normalized.replace(/^\//, ""));
  }

  // User target: install under ~/Library instead of /Library
  if (target === "user" && normalized.startsWith("/Library/")) {
    return join(homedir(), normalized.slice(1));
  }

  return normalized;
}

export { resolvePkgDest };
