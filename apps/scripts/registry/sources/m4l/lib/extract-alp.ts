// Extracts .amxd devices from Ableton Live Pack (.alp) files.
// See apps/cli/src/lib/installer/extract-alp.ts for the CLI version.

const AMPF_MARKER = Buffer.from("ampf");
const PACK_HEADER = Buffer.from("pl-a");

type M4LDeviceType = "m4l-instrument" | "m4l-audio-effect" | "m4l-midi-effect";

interface ExtractedDevice {
  type: M4LDeviceType;
  data: Buffer;
}

const TYPE_MAGIC: Record<string, M4LDeviceType> = {
  iiii: "m4l-instrument",
  aaaa: "m4l-audio-effect",
  mmmm: "m4l-midi-effect",
};

function isAlp(data: Buffer): boolean {
  return data.length >= 4 && data.subarray(0, 4).equals(PACK_HEADER);
}

function extractAlp(data: Buffer): ExtractedDevice[] {
  if (!isAlp(data)) return [];

  const offsets: number[] = [];
  let pos = 0;
  while (pos < data.length) {
    const idx = data.indexOf(AMPF_MARKER, pos);
    if (idx === -1) break;
    offsets.push(idx);
    pos = idx + AMPF_MARKER.length;
  }

  const devices: ExtractedDevice[] = [];
  for (let i = 0; i < offsets.length; i++) {
    const start = offsets[i];
    const end = i + 1 < offsets.length ? offsets[i + 1] : data.length;
    const magic = data.subarray(start + 8, start + 12).toString("ascii");
    const type = TYPE_MAGIC[magic];
    if (!type) continue;
    devices.push({ type, data: Buffer.from(data.subarray(start, end)) });
  }
  return devices;
}

export { extractAlp, isAlp };
