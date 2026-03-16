// Fetches the Open Audio Stack plugin registry index.
// Returns a map of slug -> package object, each with versions containing file entries.
// Source: https://open-audio-stack.github.io/open-audio-stack-registry/plugins/index.json

const OAS_PLUGINS_URL =
  "https://open-audio-stack.github.io/open-audio-stack-registry/plugins/index.json";

interface OasFileEntry {
  systems: Array<{ type: string }>;
  architectures: string[];
  contains: string[];
  type: string;
  size: number;
  sha256: string;
  url: string;
}

interface OasVersionEntry {
  name: string;
  author: string;
  description: string;
  license: string;
  type: string;
  tags: string[];
  url: string;
  audio?: string;
  image?: string;
  date: string;
  changes?: string;
  files: OasFileEntry[];
  verified?: boolean;
}

interface OasPackage {
  slug: string;
  version: string;
  versions: Record<string, OasVersionEntry>;
}

type OasRegistry = Record<string, OasPackage>;

async function fetchOasRegistry(): Promise<OasRegistry> {
  const response = await fetch(OAS_PLUGINS_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch OAS registry: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as OasRegistry;
}

export { fetchOasRegistry };
export type { OasFileEntry, OasPackage, OasRegistry, OasVersionEntry };
