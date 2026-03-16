// Extracts a version string from a GitHub release tag.
// Most repos use semver tags (v1.3.4, 1.0.1) - strips the v prefix and uses as-is.
// Rolling releases (tags like "latest" or "nightly") have no version in the tag,
// so we use the release publish date as the version (2026.02.13).
function versionFromTag(tag: string, publishedAt: string): string {
  const cleaned = tag.replace(/^v/, "");
  if (/^\d+\.\d+/.test(cleaned)) return cleaned;

  // Rolling release - use publish date as version (2026.03.16)
  return publishedAt.split("T")[0].replaceAll("-", ".");
}

export { versionFromTag };
