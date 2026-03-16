// SFZ sample libraries don't contain plugin binaries - skip them
function isSfzOnly(contains: string[]): boolean {
  return contains.every((c) => ["sfz", "sf2"].includes(c));
}

export { isSfzOnly };
