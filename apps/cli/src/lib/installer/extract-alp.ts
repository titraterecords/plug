// Extracts .amxd devices from Ableton Live Pack (.alp) files.
//
// .alp structure (reverse-engineered from free packs):
//   - Plaintext header: "pl-a" magic, pack metadata (name, vendor, version)
//   - Embedded .amxd files, each starting with "ampf" marker
//   - Device type at offset +8 from marker: "aaaa" = audio, "mmmm" = midi, "iiii" = instrument
//
// This parser handles free/unencrypted .alp files only.
// Encrypted packs from ableton.com are not supported.

const AMPF_MARKER = Buffer.from("ampf");
const PACK_HEADER = Buffer.from("pl-a");

type M4LDeviceType = "instrument" | "audio-effect" | "midi-effect";

interface ExtractedDevice {
  type: M4LDeviceType;
  data: Buffer;
}

const TYPE_MAGIC: Record<string, M4LDeviceType> = {
  iiii: "instrument",
  aaaa: "audio-effect",
  mmmm: "midi-effect",
};

function readDeviceType(data: Buffer, offset: number): M4LDeviceType | null {
  const magic = data.subarray(offset + 8, offset + 12).toString("ascii");
  return TYPE_MAGIC[magic] ?? null;
}

function findMarkerOffsets(data: Buffer, marker: Buffer): number[] {
  const offsets: number[] = [];
  let pos = 0;
  while (pos < data.length) {
    const idx = data.indexOf(marker, pos);
    if (idx === -1) break;
    offsets.push(idx);
    pos = idx + marker.length;
  }
  return offsets;
}

function isAlp(data: Buffer): boolean {
  return data.length >= 4 && data.subarray(0, 4).equals(PACK_HEADER);
}

function extractAlp(data: Buffer): ExtractedDevice[] {
  if (!isAlp(data)) return [];

  const offsets = findMarkerOffsets(data, AMPF_MARKER);
  if (offsets.length === 0) return [];

  const devices: ExtractedDevice[] = [];

  for (let i = 0; i < offsets.length; i++) {
    const start = offsets[i];
    const end = i + 1 < offsets.length ? offsets[i + 1] : data.length;
    const type = readDeviceType(data, start);
    if (!type) continue;

    // Slice from the ampf marker to the next marker (or EOF).
    // Walk backwards from `end` to trim trailing non-amxd data
    // (file path metadata between entries).
    let trimmedEnd = end;
    if (i + 1 < offsets.length) {
      // Scan backwards from end to find the last byte of JSON (closing brace)
      // then include any binary footer after it
      trimmedEnd = end;
    }

    devices.push({
      type,
      data: Buffer.from(data.subarray(start, trimmedEnd)),
    });
  }

  return devices;
}

export { extractAlp, isAlp };
export type { ExtractedDevice, M4LDeviceType };
