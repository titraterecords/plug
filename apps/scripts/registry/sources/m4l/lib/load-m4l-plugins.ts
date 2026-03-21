import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface M4LPlugin {
  id: string;
  name: string;
  author: string;
  description: string;
  version: string;
  license: string;
  category: string;
  tags: string[];
  homepage: string;
  url: string;
}

async function loadM4LPlugins(): Promise<M4LPlugin[]> {
  const data = await readFile(
    join(import.meta.dirname, "../plugins.json"),
    "utf-8",
  );
  return JSON.parse(data) as M4LPlugin[];
}

export { loadM4LPlugins };
export type { M4LPlugin };
