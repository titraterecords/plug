import { readFileSync } from "node:fs";
import { join } from "node:path";

interface CustomVstPrefs {
  systemEnabled: boolean;
  customEnabled: boolean;
  customPath: string | null;
}

// Parses the binary Preferences.cfg to extract custom VST2/VST3 folder settings.
// Ableton stores these as: section header, uint32LE metadata, two bools, then
// a uint32LE string length + UTF-16LE path.
function parseCustomVstPath(
  prefsDir: string,
  format: "vst2" | "vst3",
): CustomVstPrefs {
  const none: CustomVstPrefs = {
    systemEnabled: false,
    customEnabled: false,
    customPath: null,
  };

  let buf: Buffer;
  try {
    buf = readFileSync(join(prefsDir, "Preferences.cfg"));
  } catch {
    return none;
  }

  const marker =
    format === "vst2" ? "Vst2Preferences" : "Vst3Preferences";
  const markerBuf = Buffer.from(marker, "ascii");

  // The marker appears twice: first in the schema section, then in the data section.
  // We need the second occurrence (data).
  const firstIdx = buf.indexOf(markerBuf);
  if (firstIdx === -1) return none;

  const dataIdx = buf.indexOf(markerBuf, firstIdx + markerBuf.length);
  if (dataIdx === -1) return none;

  const offset = dataIdx + markerBuf.length;
  if (offset + 6 > buf.length) return none;

  // Skip uint32LE metadata, then read two bools
  const systemEnabled = buf[offset + 4] === 1;
  const customEnabled = buf[offset + 5] === 1;

  const strLenOffset = offset + 6;
  if (strLenOffset + 4 > buf.length) {
    return { systemEnabled, customEnabled, customPath: null };
  }

  const strLen = buf.readUInt32LE(strLenOffset);
  if (strLen === 0) {
    return { systemEnabled, customEnabled, customPath: null };
  }

  const strStart = strLenOffset + 4;
  const strByteLen = strLen * 2; // UTF-16LE: 2 bytes per code unit
  if (strStart + strByteLen > buf.length) {
    return { systemEnabled, customEnabled, customPath: null };
  }

  // Decode UTF-16LE, strip trailing null if present
  const raw = buf.toString("utf16le", strStart, strStart + strByteLen);
  const customPath = raw.replace(/\0+$/, "") || null;

  return { systemEnabled, customEnabled, customPath };
}

export { parseCustomVstPath };
export type { CustomVstPrefs };
