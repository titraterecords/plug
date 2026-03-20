import { homedir } from "node:os";
import { join } from "node:path";

// Fallback when Ableton prefs can't be read or aren't installed yet.
// The user library path is version-independent.
const DEFAULT_USER_LIBRARY: Record<string, string> = {
  mac: join(homedir(), "Music/Ableton/User Library"),
  win: join(homedir(), "Documents\\Ableton\\User Library"),
};

export { DEFAULT_USER_LIBRARY };
