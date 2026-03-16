type DownloadType = "zip" | "dmg" | "pkg";

function detectDownloadType(data: Buffer): DownloadType {
  // ZIP: starts with PK (0x504B)
  if (data[0] === 0x50 && data[1] === 0x4b) return "zip";

  // XAR (flat PKG): starts with "xar!" (0x78617221)
  if (
    data[0] === 0x78 &&
    data[1] === 0x61 &&
    data[2] === 0x72 &&
    data[3] === 0x21
  )
    return "pkg";

  // DMG: zlib-compressed UDIF has no simple magic bytes, treat as default
  return "dmg";
}

export { detectDownloadType };
