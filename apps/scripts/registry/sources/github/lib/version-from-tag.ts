// Extracts a semver-style version from a GitHub release tag.
// Falls back to the publish date for rolling releases (e.g. "latest", "nightly").
function versionFromTag(tag: string, publishedAt: string): string {
  const cleaned = tag.replace(/^v/, "");
  if (/^\d+\.\d+/.test(cleaned)) return cleaned;

  // Rolling release - use publish date as version (2026.03.16)
  return publishedAt.split("T")[0].replaceAll("-", ".");
}

export { versionFromTag };
