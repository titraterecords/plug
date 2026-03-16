import { createHash } from "node:crypto";

// Downloads a file and returns its sha256 hash without extracting.
// Used when the archive can't be scanned (e.g. contains only an exe
// installer) but we still need the checksum.
async function computeSha256FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${url}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  return createHash("sha256").update(data).digest("hex");
}

export { computeSha256FromUrl };
