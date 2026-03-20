import { readFileSync } from "node:fs";
import { join } from "node:path";

interface ScanPaths {
  vst3: string[];
  vst2: string[];
}

// Parses Ableton's PluginScanner.txt to extract the actual scan directories.
// Returns unique paths per format, in the order they appear.
function parseScanPaths(prefsDir: string): ScanPaths {
  let log: string;
  try {
    log = readFileSync(join(prefsDir, "PluginScanner.txt"), "utf-8");
  } catch {
    return { vst3: [], vst2: [] };
  }

  const vst3 = new Set<string>();
  const vst2 = new Set<string>();

  // Pattern: `VST3: scanning plugins in "/path" (user|local)`
  const re = /^.+?(VST[23]): scanning plugins in "([^"]+)"/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(log)) !== null) {
    const format = match[1];
    const path = match[2];
    if (format === "VST3") vst3.add(path);
    else vst2.add(path);
  }

  return { vst3: [...vst3], vst2: [...vst2] };
}

export { parseScanPaths };
export type { ScanPaths };
