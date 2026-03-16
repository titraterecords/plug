import { execSync } from "node:child_process";

const SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    url: { type: ["string", "null"], description: "The official homepage URL, or null if not found" },
  },
  required: ["url"],
});

// Uses Claude Code CLI with structured output to web search for a plugin's homepage.
// Returns a validated URL or undefined. Uses the user's subscription - no API key needed.
async function searchHomepage(
  pluginName: string,
  author: string,
): Promise<string | undefined> {
  try {
    const prompt = `Search the web for the official homepage or download page of "${pluginName}" audio plugin by ${author}. Return the URL or null if not found.`;

    const result = execSync(
      `claude --print --output-format json --json-schema '${SCHEMA}' -p ${JSON.stringify(prompt)}`,
      { encoding: "utf-8", timeout: 60000 },
    ).trim();

    const parsed = JSON.parse(result);
    return parsed.result?.url ?? parsed.url ?? undefined;
  } catch (err) {
    console.warn(
      `  Search failed: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`,
    );
    return undefined;
  }
}

export { searchHomepage };
