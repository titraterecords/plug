import { readFileSync } from "node:fs";
import { join } from "node:path";

// Extracts the user library path from Ableton's Library.cfg (XML).
// Returns null if the file is missing or the path is not set.
function parseUserLibrary(prefsDir: string): string | null {
  let xml: string;
  try {
    xml = readFileSync(join(prefsDir, "Library.cfg"), "utf-8");
  } catch {
    return null;
  }

  const match = xml.match(/<ProjectPath\s+Value="([^"]+)"/);
  return match?.[1] ?? null;
}

export { parseUserLibrary };
