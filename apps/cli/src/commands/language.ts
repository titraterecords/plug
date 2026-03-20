import type { Command } from "commander";
import { select } from "@inquirer/prompts";
import { loadConfig, saveConfig } from "../lib/config.js";
import { success } from "../lib/logger.js";

const LANGUAGES = [
  { value: "de", flag: "\u{1F1E9}\u{1F1EA}", name: "Deutsch" },
  { value: "en", flag: "\u{1F1EC}\u{1F1E7}", name: "English" },
  { value: "es", flag: "\u{1F1EA}\u{1F1F8}", name: "Espa\u00F1ol" },
  { value: "fr", flag: "\u{1F1EB}\u{1F1F7}", name: "Fran\u00E7ais" },
  { value: "it", flag: "\u{1F1EE}\u{1F1F9}", name: "Italiano" },
  { value: "ja", flag: "\u{1F1EF}\u{1F1F5}", name: "\u65E5\u672C\u8A9E" },
  { value: "pt", flag: "\u{1F1E7}\u{1F1F7}", name: "Portugu\u00EAs" },
  { value: "zh", flag: "\u{1F1E8}\u{1F1F3}", name: "\u4E2D\u6587" },
] as const;

function registerLanguage(program: Command): void {
  program
    .command("language")
    .description("Set display language for plugin metadata")
    .action(async () => {
      const config = await loadConfig();
      const current = config.language ?? "en";

      try {
        type LangValue = (typeof LANGUAGES)[number]["value"];
        const language = await select({
          message: "Display language",
          choices: LANGUAGES.map((l) => ({
            name: `${l.flag}  ${l.name}`,
            value: l.value,
          })),
          default: current as LangValue,
        });

        await saveConfig({ ...config, language });
        const chosen = LANGUAGES.find((l) => l.value === language)!;
        success(`Language set to ${chosen.flag}  ${chosen.name}`);
      } catch {
        return;
      }
    });
}

export { registerLanguage };
