import type { Locale, Plugin } from "@titrate/registry-schema/schema";

function pluginDescription(plugin: Plugin, locale: string): string {
  if (!plugin.meta) return plugin.description;
  const entry = plugin.meta[locale as Locale];
  return entry?.description ?? plugin.meta.en.description;
}

function pluginTags(plugin: Plugin, locale: string): string[] {
  if (!plugin.meta) return plugin.tags ?? [];
  const entry = plugin.meta[locale as Locale];
  return entry?.tags ?? plugin.meta.en.tags ?? [];
}

export { pluginDescription, pluginTags };
