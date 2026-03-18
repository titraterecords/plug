import { execSync } from "node:child_process";

// macOS quarantines files downloaded from the internet, which causes
// Gatekeeper to block unsigned plugins. This removes the quarantine
// attribute so DAWs can load the plugin without manual intervention.
function removeQuarantine(path: string): void {
  if (process.platform !== "darwin") return;
  execSync(`xattr -rd com.apple.quarantine "${path}" 2>/dev/null || true`);
}

export { removeQuarantine };
