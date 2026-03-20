import { homedir } from "node:os";
import { join } from "node:path";

// PLUG_HOME overrides all derived paths - used for e2e testing and custom installs
const PLUG_HOME = process.env.PLUG_HOME;
const IS_CUSTOM_HOME = Boolean(PLUG_HOME);
const HOME_DIR = PLUG_HOME ?? join(homedir(), ".plug");

export { HOME_DIR, IS_CUSTOM_HOME, PLUG_HOME };
