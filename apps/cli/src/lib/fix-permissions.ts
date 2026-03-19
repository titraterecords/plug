import { chown, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { CACHE_DIR } from "../constants.js";

// When plug is run with sudo, files in ~/.plug/ get created as root.
// This locks out normal usage with EACCES errors. Fix by resetting
// ownership to the real user (SUDO_USER) on every run.
async function fixPermissions(): Promise<void> {
  const sudoUser = process.env.SUDO_UID;
  const sudoGroup = process.env.SUDO_GID;

  // Not running as sudo, or on Windows - nothing to fix
  if (!sudoUser || process.platform === "win32") return;

  const uid = parseInt(sudoUser, 10);
  const gid = parseInt(sudoGroup ?? sudoUser, 10);

  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await chown(CACHE_DIR, uid, gid);

    const entries = await readdir(CACHE_DIR);
    for (const entry of entries) {
      const path = join(CACHE_DIR, entry);
      try {
        const s = await stat(path);
        if (s.uid === 0) {
          await chown(path, uid, gid);
        }
      } catch {
        // Skip files we can't stat
      }
    }
  } catch {
    // Best effort - don't crash if we can't fix permissions
  }
}

export { fixPermissions };
