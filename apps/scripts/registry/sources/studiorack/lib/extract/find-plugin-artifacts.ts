import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const PLUGIN_EXTENSIONS = [".vst3", ".component", ".clap", ".lv2", ".amxd"];

const EXTENSION_TO_FORMAT: Record<string, string> = {
  ".vst3": "vst3",
  ".component": "au",
  ".clap": "clap",
  ".lv2": "lv2",
  // .amxd format is determined by reading the binary header (see detectM4lType)
};

// Bytes 8-11 in the .amxd binary header encode the device type
const M4L_TYPE_MAGIC: Record<string, string> = {
  iiii: "m4l-instrument",
  aaaa: "m4l-audio-effect",
  mmmm: "m4l-midi-effect",
};

interface FoundArtifact {
  format: string;
  artifact: string;
}

// Reads the .amxd binary header to detect the M4L device type.
// Returns null for unrecognized files.
async function detectM4lType(filePath: string): Promise<string | null> {
  const header = Buffer.alloc(12);
  const fd = await readFile(filePath);
  fd.copy(header, 0, 0, 12);

  if (header.subarray(0, 4).toString("ascii") !== "ampf") return null;
  const magic = header.subarray(8, 12).toString("ascii");
  return M4L_TYPE_MAGIC[magic] ?? null;
}

// Recursively scans a directory for plugin bundles by extension.
// Returns the artifact filename (e.g. "Surge XT.vst3") and its format.
// For .amxd files, reads the binary header to determine the M4L device type.
async function findPluginArtifacts(dir: string): Promise<FoundArtifact[]> {
  const results: FoundArtifact[] = [];
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    for (const ext of PLUGIN_EXTENSIONS) {
      if (entry.name.endsWith(ext)) {
        if (ext === ".amxd") {
          const parentPath = entry.parentPath;
          const fullPath = join(parentPath, entry.name);
          const format = await detectM4lType(fullPath);
          if (format) {
            results.push({ format, artifact: entry.name });
          }
        } else {
          const format = EXTENSION_TO_FORMAT[ext];
          results.push({ format, artifact: entry.name });
        }
      }
    }
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.format}:${r.artifact}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { findPluginArtifacts };
export type { FoundArtifact };
