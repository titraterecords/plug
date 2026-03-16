import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface RepoEntry {
  repo: string;
  id: string;
  name?: string;
  author?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

const REPOS_PATH = join(import.meta.dirname, "../repos.json");

// Loads the list of GitHub repos to import from repos.json
async function loadRepos(): Promise<RepoEntry[]> {
  const data = await readFile(REPOS_PATH, "utf-8");
  return JSON.parse(data) as RepoEntry[];
}

export { loadRepos };
export type { RepoEntry };
