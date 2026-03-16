import type { FoundArtifact } from "../studiorack/lib/scan-artifacts.js";

const EXTENSION_TO_FORMAT: Record<string, string> = {
  ".vst3": "vst3",
  ".component": "au",
  ".clap": "clap",
  ".lv2": "lv2",
};

// Converts artifact filenames (e.g. "Foo.vst3") into FoundArtifact objects
// by deriving format from the file extension.
function artifactsFromNames(names: string[]): FoundArtifact[] {
  const results: FoundArtifact[] = [];
  for (const name of names) {
    for (const [ext, format] of Object.entries(EXTENSION_TO_FORMAT)) {
      if (name.endsWith(ext)) {
        results.push({ format, artifact: name });
      }
    }
  }
  return results;
}

export { artifactsFromNames };
