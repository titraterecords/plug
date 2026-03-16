import { execFileSync } from "node:child_process";

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  published_at: string;
  prerelease: boolean;
  assets: ReleaseAsset[];
}

// Matches tags that indicate unstable releases.
// These get filtered out so we only import stable versions users can trust.
const PRE_RELEASE_PATTERN = /alpha|beta|rc|pre|nightly|dev/i;

// Fetches recent stable releases for a GitHub repo using the gh CLI.
// Filters out pre-releases (both GitHub's prerelease flag and tag patterns
// like "v1.0.0-beta") and returns at most maxStable releases.
// Fetches 30 to have enough candidates after filtering.
function fetchReleases(repo: string, maxStable = 5): Release[] {
  const result = execFileSync("gh", [
    "api",
    `repos/${repo}/releases?per_page=30`,
  ]);

  const all = JSON.parse(result.toString()) as Release[];

  // Filter: not marked as prerelease, tag doesn't contain beta/rc/alpha/etc
  const stable = all.filter(
    (r) => !r.prerelease && !PRE_RELEASE_PATTERN.test(r.tag_name),
  );

  return stable.slice(0, maxStable);
}

export { fetchReleases };
export type { Release, ReleaseAsset };
