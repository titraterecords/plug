import { createHash } from "node:crypto";

function verifyChecksum(data: Buffer, expected: string): boolean {
  const actual = createHash("sha256").update(data).digest("hex");
  return actual === expected;
}

function computeChecksum(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

export { computeChecksum, verifyChecksum };
