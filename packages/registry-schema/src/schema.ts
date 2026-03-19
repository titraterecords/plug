import { z } from "zod";

const FORMATS = ["vst3", "au", "clap", "lv2"] as const;
const PLATFORMS = ["mac", "win", "linux"] as const;

// A single downloadable file for one format on one platform
const FormatEntrySchema = z.object({
  url: z.string().url(),
  sha256: z.string().min(64).max(64),
  artifact: z.union([z.string(), z.array(z.string())]),
});

// Maps platform -> download entry, so one format can have different binaries per OS
const PlatformFormatsSchema = z.record(z.enum(PLATFORMS), FormatEntrySchema);

const SOURCES = ["studiorack", "github", "manual"] as const;

const VersionEntrySchema = z.object({
  date: z.string().optional(),
  source: z.enum(SOURCES).optional(),
  formats: z.record(z.enum(FORMATS), PlatformFormatsSchema),
});

const LOCALES = ["de", "en", "es", "fr", "it", "ja", "pt", "zh"] as const;

const LocaleMetaSchema = z.object({
  description: z.string(),
  tags: z.array(z.string()).optional(),
});

// en is always present as the fallback language
const MetaSchema = z.object({
  en: LocaleMetaSchema,
  de: LocaleMetaSchema.optional(),
  es: LocaleMetaSchema.optional(),
  fr: LocaleMetaSchema.optional(),
  it: LocaleMetaSchema.optional(),
  ja: LocaleMetaSchema.optional(),
  pt: LocaleMetaSchema.optional(),
  zh: LocaleMetaSchema.optional(),
});

const PluginSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  author: z.string(),
  description: z.string(),
  // Points to latest version - shared metadata (author, license, etc.) lives
  // at the top level to avoid repeating it in every version entry
  version: z.string(),
  license: z.string(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  meta: MetaSchema.optional(),
  recommended: z.boolean().optional(),
  // Plugins that install resources to system paths (e.g. /Library/Application Support/)
  // need sudo on macOS. The CLI checks this before downloading.
  systemInstall: z.boolean().optional(),
  homepage: z.string().url(),
  versions: z.record(z.string(), VersionEntrySchema),
});

const RegistrySchema = z.object({
  version: z.string(),
  updated: z.string(),
  plugins: z.array(PluginSchema),
});

type FormatEntry = z.infer<typeof FormatEntrySchema>;
type VersionEntry = z.infer<typeof VersionEntrySchema>;
type Plugin = z.infer<typeof PluginSchema>;
type Registry = z.infer<typeof RegistrySchema>;
type PluginFormat = (typeof FORMATS)[number];
type Platform = (typeof PLATFORMS)[number];
type Source = (typeof SOURCES)[number];
type Locale = (typeof LOCALES)[number];
type LocaleMeta = z.infer<typeof LocaleMetaSchema>;

export {
  FORMATS,
  FormatEntrySchema,
  LOCALES,
  LocaleMetaSchema,
  MetaSchema,
  PLATFORMS,
  PlatformFormatsSchema,
  PluginSchema,
  RegistrySchema,
  SOURCES,
  VersionEntrySchema,
};
export type {
  FormatEntry,
  Locale,
  LocaleMeta,
  Platform,
  Plugin,
  PluginFormat,
  Registry,
  Source,
  VersionEntry,
};
