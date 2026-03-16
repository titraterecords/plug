interface PluginRef {
  name: string;
  version?: string;
}

// Splits "surge-xt@1.3.1" into { name: "surge-xt", version: "1.3.1" }.
// Uses lastIndexOf so a bare "@" at position 0 (no name) is treated as a plain name.
function parsePluginRef(input: string): PluginRef {
  const atIndex = input.lastIndexOf("@");
  if (atIndex > 0) {
    return {
      name: input.slice(0, atIndex),
      version: input.slice(atIndex + 1),
    };
  }
  return { name: input };
}

export { parsePluginRef };
