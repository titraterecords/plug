import { execFileSync } from "node:child_process";

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

// Fetches all releases for a GitHub repo using the gh CLI.
// Auth is handled automatically by gh.
function fetchReleases(repo: string): Release[] {
  const result = execFileSync("gh", [
    "api",
    `repos/${repo}/releases`,
    "--paginate",
  ]);

  return JSON.parse(result.toString()) as Release[];
}

export { fetchReleases };
export type { Release, ReleaseAsset };
