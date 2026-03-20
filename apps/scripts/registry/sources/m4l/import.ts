// Imports Max for Live devices into the registry.
// Downloads each archive, detects .amxd device types from binary headers,
// and builds registry entries with mac+win platform support (same file).
//
// Handles two archive types:
// - .zip containing .amxd files: scans for artifacts, detects type
// - .zip containing .alp (Ableton Live Pack): extracts embedded .amxd devices
//
// Usage: pnpm import:m4l

import { createHash } from "node:crypto";
import { mkdir, rm, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadM4LPlugins } from "./lib/load-m4l-plugins.js";
import { loadRegistry } from "../studiorack/lib/load-registry.js";
import { saveRegistry } from "../studiorack/lib/save-registry.js";
import { mergeManualPlugins } from "../manual/lib/merge-manual-plugins.js";
import type { RegistryPlugin } from "../studiorack/lib/build-registry-entry.js";
import { extractZip } from "../studiorack/lib/extract/extract-zip.js";
import { findPluginArtifacts } from "../studiorack/lib/extract/find-plugin-artifacts.js";
import { extractAlp, isAlp } from "./lib/extract-alp.js";

async function downloadAndHash(url: string): Promise<{ data: Buffer; sha256: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash("sha256").update(data).digest("hex");
  return { data, sha256 };
}

async function scanM4LArtifacts(
  data: Buffer,
  tmpDir: string,
): Promise<Array<{ format: string; artifact: string }>> {
  // Extract the zip
  await extractZip(data, tmpDir);

  // Check if any extracted file is an .alp
  const entries = await readdir(tmpDir, { recursive: true });
  const alpFile = entries.find((e) => e.toString().endsWith(".alp"));

  if (alpFile) {
    // Read the .alp and extract .amxd devices from it
    const { readFile } = await import("node:fs/promises");
    const alpData = await readFile(join(tmpDir, alpFile.toString()));

    if (isAlp(alpData)) {
      const devices = extractAlp(alpData);

      // Write extracted .amxd files to disk so the artifact scanner can find them
      for (let i = 0; i < devices.length; i++) {
        const amxdPath = join(tmpDir, `device_${i}.amxd`);
        await writeFile(amxdPath, devices[i].data);
      }
    }
  }

  // Scan for all .amxd artifacts (including ones extracted from .alp)
  return findPluginArtifacts(tmpDir);
}

async function main(): Promise<void> {
  const plugins = await loadM4LPlugins();
  console.log(`Loaded ${plugins.length} M4L device(s)`);

  const registry = await loadRegistry();
  const newPlugins: RegistryPlugin[] = [];

  for (const plugin of plugins) {
    console.log(`\n${plugin.name} (${plugin.version})`);

    const tmpDir = join(tmpdir(), `plug-m4l-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    try {
      console.log(`  Downloading: ${plugin.url}`);
      const { data, sha256 } = await downloadAndHash(plugin.url);
      console.log(`  sha256: ${sha256}`);

      const artifacts = await scanM4LArtifacts(data, tmpDir);

      if (artifacts.length === 0) {
        console.log("  No .amxd artifacts found");
        continue;
      }

      console.log(`  Found: ${artifacts.map((a) => `${a.artifact} (${a.format})`).join(", ")}`);

      // Build formats - same file for mac and win
      const formats: Record<string, Record<string, { url: string; sha256: string; artifact: string | string[] }>> = {};

      // Group artifacts by format
      const byFormat = new Map<string, string[]>();
      for (const a of artifacts) {
        const existing = byFormat.get(a.format) ?? [];
        existing.push(a.artifact);
        byFormat.set(a.format, existing);
      }

      for (const [format, names] of byFormat) {
        const artifact = names.length === 1 ? names[0] : names;
        formats[format] = {
          mac: { url: plugin.url, sha256, artifact },
          win: { url: plugin.url, sha256, artifact },
        };
      }

      newPlugins.push({
        id: plugin.id,
        name: plugin.name,
        author: plugin.author,
        description: plugin.description,
        version: plugin.version,
        license: plugin.license,
        category: plugin.category,
        tags: plugin.tags,
        homepage: plugin.homepage,
        versions: {
          [plugin.version]: { source: "manual", formats },
        },
      });
    } catch (err) {
      console.error(`  Failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  }

  console.log(`\nMerging ${newPlugins.length} device(s) into registry...`);
  const { merged, added, updated } = mergeManualPlugins(registry.plugins, newPlugins);

  registry.plugins = merged;
  await saveRegistry(registry);

  console.log(`\nDone.`);
  console.log(`  Added: ${added.length} new device(s)`);
  console.log(`  Updated: ${updated.length} existing device(s)`);
  if (added.length > 0) {
    console.log(`  New: ${added.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
