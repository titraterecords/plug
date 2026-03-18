type DownloadType = "zip" | "dmg" | "pkg" | "exe";

// Identifies archive format from the first bytes of a downloaded file.
// DMG is the fallback because zlib-compressed UDIF images have no
// reliable magic bytes - anything that isn't ZIP, PKG, or EXE on
// macOS is almost certainly a DMG.
function detectDownloadType(data: Buffer): DownloadType {
  if (data[0] === 0x50 && data[1] === 0x4b) return "zip"; // PK
  if (
    data[0] === 0x78 &&
    data[1] === 0x61 &&
    data[2] === 0x72 &&
    data[3] === 0x21
  )
    return "pkg"; // xar!
  if (data[0] === 0x4d && data[1] === 0x5a) return "exe"; // MZ
  return "dmg";
}

export { detectDownloadType };
export type { DownloadType };
