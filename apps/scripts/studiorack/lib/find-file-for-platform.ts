import type { Platform } from "@titrate/registry-schema/schema";
import type { OasFileEntry } from "./fetch-oas-registry.js";

// A file entry matches if any of its systems[].type matches the platform
function findFileForPlatform(
  files: OasFileEntry[],
  platform: Platform,
): OasFileEntry | undefined {
  return files.find((f) =>
    f.systems.some((s) => s.type === platform),
  );
}

export { findFileForPlatform };
