import {
  LOCALES,
  type Platform,
  type Plugin,
  type PluginFormat,
  type Registry,
} from "@titrate/registry-schema/schema";
import { availableFormats } from "./registry.js";

interface SearchOptions {
  category?: string;
  format?: string;
  os?: Platform;
}

function matchesQuery(plugin: Plugin, lower: string): boolean {
  if (
    plugin.id.includes(lower) ||
    plugin.name.toLowerCase().includes(lower) ||
    plugin.category.toLowerCase().includes(lower)
  ) {
    return true;
  }

  // Search across all locales in meta
  if (plugin.meta) {
    for (const locale of LOCALES) {
      const entry = plugin.meta[locale];
      if (!entry) continue;
      if (entry.description.toLowerCase().includes(lower)) return true;
      if (entry.tags?.some((t) => t.toLowerCase().includes(lower))) return true;
    }
    return false;
  }

  // Fall back to root description/tags for plugins without meta
  return (
    plugin.description.toLowerCase().includes(lower) ||
    (plugin.tags ?? []).some((t) => t.toLowerCase().includes(lower))
  );
}

function searchPlugins(
  registry: Registry,
  query: string,
  options: SearchOptions = {},
): Plugin[] {
  const lower = query.toLowerCase();

  let results = registry.plugins.filter((p) => matchesQuery(p, lower));

  if (options.category) {
    const cat = options.category.toLowerCase();
    results = results.filter((p) => p.category.toLowerCase() === cat);
  }

  if (options.format && options.os) {
    // With OS context, only show plugins that have this format for this OS
    const fmt = options.format as PluginFormat;
    results = results.filter((p) =>
      availableFormats(p, options.os!).includes(fmt),
    );
  } else if (options.format) {
    // Without OS, check if the format exists on any platform
    const fmt = options.format as PluginFormat;
    results = results.filter((p) => {
      const entry = p.versions[p.version];
      return entry && fmt in entry.formats;
    });
  }

  return results;
}

export { searchPlugins };
