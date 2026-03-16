import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CURATION_PATH = join(import.meta.dirname, "../../registry/curation.json");

interface Curation {
  idOverrides: Record<string, string>;
}

// Loads curation ID overrides so we can resolve OAS slugs to our final IDs
async function loadIdOverrides(): Promise<Map<string, string>> {
  try {
    const data = await readFile(CURATION_PATH, "utf-8");
    const curation = JSON.parse(data) as Curation;
    const map = new Map<string, string>();
    for (const [slug, id] of Object.entries(curation.idOverrides)) {
      map.set(slug, id);
    }
    return map;
  } catch {
    return new Map();
  }
}

export { loadIdOverrides };
