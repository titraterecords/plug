import { detectDownloadType } from "./detect-type.js";

// PKG detection extracted so the install command can route PKG downloads
// to the multi-destination installer instead of the single-directory flow.
function isPkg(data: Buffer): boolean {
  return detectDownloadType(data) === "pkg";
}

export { isPkg };
