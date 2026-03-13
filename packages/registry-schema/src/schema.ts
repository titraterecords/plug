import { z } from "zod";

const FORMATS = ["vst3", "au", "clap"] as const;

const FormatSchema = z.object({
  url: z.string().url(),
  sha256: z.string().min(64).max(64),
  artifact: z.string(),
});

const PluginSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  author: z.string(),
  description: z.string(),
  version: z.string(),
  license: z.string(),
  category: z.string(),
  homepage: z.string().url(),
  formats: z.record(z.enum(FORMATS), FormatSchema),
});

const RegistrySchema = z.object({
  version: z.string(),
  updated: z.string(),
  plugins: z.array(PluginSchema),
});

type Format = z.infer<typeof FormatSchema>;
type Plugin = z.infer<typeof PluginSchema>;
type Registry = z.infer<typeof RegistrySchema>;
type PluginFormat = (typeof FORMATS)[number];

export { FORMATS, FormatSchema, PluginSchema, RegistrySchema };
export type { Format, Plugin, PluginFormat, Registry };
