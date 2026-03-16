import type { Platform } from "@titrate/registry-schema/schema";

// Maps Node's process.platform values to our Platform type
const PLATFORM_MAP: Record<string, Platform> = {
  darwin: "mac",
  linux: "linux",
  win32: "win",
};

function currentPlatform(): Platform {
  const platform = PLATFORM_MAP[process.platform];
  if (!platform) {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  return platform;
}

export { currentPlatform };
