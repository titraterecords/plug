import type { Platform, PluginFormat } from "@titrate/registry-schema/schema";

// Install order when no --format flag is given.
// Only formats that actually exist on each platform are listed.
const FORMAT_PREFERENCE: Record<Platform, PluginFormat[]> = {
  mac: ["vst3", "au", "clap", "m4l-instrument", "m4l-audio-effect", "m4l-midi-effect"],
  linux: ["vst3", "clap", "lv2"],
  win: ["vst3", "clap", "m4l-instrument", "m4l-audio-effect", "m4l-midi-effect"],
};

export { FORMAT_PREFERENCE };
