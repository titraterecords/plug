import { join } from "node:path";
import { HOME_DIR } from "./home.js";

const CACHE_DIR = HOME_DIR;

const REGISTRY_URL =
  "https://raw.githubusercontent.com/titraterecords/plug/main/registry.json";
const REGISTRY_CACHE_PATH = join(CACHE_DIR, "registry.json");
const CONFIG_PATH = join(CACHE_DIR, "config.json");
const INSTALLED_PATH = join(CACHE_DIR, "installed.json");
const VERSION_CACHE_PATH = join(CACHE_DIR, "version-check.json");

export {
  CACHE_DIR,
  CONFIG_PATH,
  INSTALLED_PATH,
  REGISTRY_CACHE_PATH,
  REGISTRY_URL,
  VERSION_CACHE_PATH,
};
