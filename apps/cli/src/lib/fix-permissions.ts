import { chown } from "node:fs/promises";

// When running under sudo, Node.js creates files as root.
// This resets ownership to the real user so subsequent runs
// without sudo don't get EACCES errors.
// Call after any file/directory creation in ~/.plug/.
async function chownToUser(path: string): Promise<void> {
  const uid = process.env.SUDO_UID;
  const gid = process.env.SUDO_GID;
  if (!uid || process.platform === "win32") return;

  try {
    await chown(path, parseInt(uid, 10), parseInt(gid ?? uid, 10));
  } catch {
    // Best effort
  }
}

export { chownToUser };
