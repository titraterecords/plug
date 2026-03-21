import { describe, expect, it } from "vitest";
import { extractAlp, isAlp } from "./extract-alp.js";

// Build minimal .alp and .amxd test fixtures from the known binary structure.
// Real files confirmed: header is "pl-a", .amxd entries start with "ampf",
// device type is 4 bytes at offset +8 from "ampf".

function buildAmxd(
  typeCode: string,
  jsonBody: string,
): Buffer {
  const header = Buffer.alloc(32);
  header.write("ampf", 0);
  header.writeUInt32LE(4, 4);
  header.write(typeCode, 8);
  header.write("meta", 12);
  header.writeUInt32LE(4, 16);
  header.writeUInt32LE(7, 20);
  header.write("ptch", 24);
  header.writeUInt32LE(jsonBody.length, 28);

  return Buffer.concat([header, Buffer.from(jsonBody)]);
}

function buildAlp(devices: Buffer[]): Buffer {
  const metadata =
    'pl-a\x89\xe5G\x00\x00\x00\x00\x00Ableton#04I\n\nFolderConfigData\n' +
    '{\n  String PackDisplayName = "Test Pack";\n}\n';

  return Buffer.concat([Buffer.from(metadata), ...devices]);
}

const instrumentJson = '{"patcher":{"fileversion":1,"devicetype":"instrument"}}';
const audioJson = '{"patcher":{"fileversion":1,"devicetype":"audio"}}';
const midiJson = '{"patcher":{"fileversion":1,"devicetype":"midi"}}';

const instrumentAmxd = buildAmxd("iiii", instrumentJson);
const audioAmxd = buildAmxd("aaaa", audioJson);
const midiAmxd = buildAmxd("mmmm", midiJson);

describe("isAlp", () => {
  it("detects .alp files by pl-a magic", () => {
    const alp = buildAlp([instrumentAmxd]);
    expect(isAlp(alp)).toBe(true);
  });

  it("rejects non-alp data", () => {
    expect(isAlp(Buffer.from("not an alp file"))).toBe(false);
  });

  it("rejects empty buffer", () => {
    expect(isAlp(Buffer.alloc(0))).toBe(false);
  });

  it("rejects buffer too short for magic", () => {
    expect(isAlp(Buffer.from("pl"))).toBe(false);
  });
});

describe("extractAlp", () => {
  it("extracts a single instrument device", () => {
    const alp = buildAlp([instrumentAmxd]);
    const devices = extractAlp(alp);

    expect(devices).toHaveLength(1);
    expect(devices[0].type).toBe("instrument");
    expect(devices[0].data.subarray(0, 4).toString()).toBe("ampf");
  });

  it("extracts multiple devices with correct types", () => {
    const alp = buildAlp([instrumentAmxd, audioAmxd, midiAmxd]);
    const devices = extractAlp(alp);

    expect(devices).toHaveLength(3);
    expect(devices[0].type).toBe("instrument");
    expect(devices[1].type).toBe("audio-effect");
    expect(devices[2].type).toBe("midi-effect");
  });

  it("preserves device data from ampf marker to next marker", () => {
    const alp = buildAlp([instrumentAmxd, audioAmxd]);
    const devices = extractAlp(alp);

    expect(devices[0].data.length).toBe(instrumentAmxd.length);
    expect(devices[0].data.indexOf(instrumentJson)).toBeGreaterThan(0);
  });

  it("returns empty array for non-alp data", () => {
    expect(extractAlp(Buffer.from("not alp"))).toStrictEqual([]);
  });

  it("returns empty array for alp with no devices", () => {
    const emptyAlp = Buffer.from(
      'pl-a\x89\xe5G\x00\x00\x00\x00\x00Ableton#04I\n\nFolderConfigData\n{}\n',
    );
    expect(extractAlp(emptyAlp)).toStrictEqual([]);
  });

  it("skips devices with unknown type magic", () => {
    const unknownAmxd = buildAmxd("xxxx", '{"patcher":{}}');
    const alp = buildAlp([instrumentAmxd, unknownAmxd, audioAmxd]);
    const devices = extractAlp(alp);

    expect(devices).toHaveLength(2);
    expect(devices[0].type).toBe("instrument");
    expect(devices[1].type).toBe("audio-effect");
  });
});
