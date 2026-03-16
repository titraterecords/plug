// Converts an OAS slug like "surge-synthesizer/surge" to a flat id like "surge"
function slugToId(slug: string): string {
  return slug.split("/").pop() ?? slug;
}

export { slugToId };
