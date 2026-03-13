import { execSync } from "node:child_process";
import { TAP_NAME } from "../constants.js";

function isBrewInstalled(): boolean {
  try {
    execSync("brew --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isTapAdded(): boolean {
  try {
    const output = execSync("brew tap", { encoding: "utf-8" });
    return output.split("\n").includes(TAP_NAME);
  } catch {
    return false;
  }
}

function addTap(): void {
  execSync(`brew tap ${TAP_NAME}`, { stdio: "inherit" });
}

export { addTap, isBrewInstalled, isTapAdded };
