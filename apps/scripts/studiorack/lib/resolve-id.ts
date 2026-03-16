// Resolves the final registry ID for an OAS slug, checking curation overrides first
function resolveId(slug: string, overrides: Map<string, string>): string {
  return overrides.get(slug) ?? slug.split("/").pop() ?? slug;
}

export { resolveId };
