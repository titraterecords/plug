// Validates all URLs in the registry.
// - Download URLs: 404 entries get removed from registry
// - Homepage URLs: 404s trigger a web search via Claude Code CLI
//   to find the current URL. Results are cached to avoid repeat searches.
//
// Usage: pnpm validate:registry

import { checkUrl } from "./validate/check-url.js";
import { loadHomepageCache, type HomepageCache } from "./validate/load-homepage-cache.js";
import { saveHomepageCache } from "./validate/save-homepage-cache.js";
import { searchHomepage } from "./validate/search-homepage.js";
import { loadRegistry } from "./sources/studiorack/lib/load-registry.js";
import { saveRegistry } from "./sources/studiorack/lib/save-registry.js";

async function main(): Promise<void> {
  const registry = await loadRegistry();
  const cache = await loadHomepageCache();

  let removedDownloads = 0;
  let brokenHomepages = 0;
  let fixedHomepages = 0;
  let cachedSkips = 0;
  let modified = false;

  for (const plugin of registry.plugins) {
    console.log(`\n${plugin.id}`);

    // Check download URLs - remove 404s
    for (const [ver, versionEntry] of Object.entries(plugin.versions)) {
      for (const [fmt, platforms] of Object.entries(versionEntry.formats)) {
        for (const [plat, entry] of Object.entries(platforms)) {
          const status = await checkUrl(entry.url);

          if (status >= 400 || status === 0) {
            console.log(`  REMOVE ${ver} ${fmt}/${plat} (${status || "unreachable"})`);
            delete platforms[plat];
            removedDownloads++;
            modified = true;
          }
        }

        // Clean up empty platform maps
        if (Object.keys(platforms).length === 0) {
          delete versionEntry.formats[fmt];
        }
      }

      // Clean up empty format maps
      if (Object.keys(versionEntry.formats).length === 0) {
        delete plugin.versions[ver];
      }
    }

    // Check homepage URL
    const homepageStatus = await checkUrl(plugin.homepage);

    if (homepageStatus >= 400 || homepageStatus === 0) {
      brokenHomepages++;

      // Check cache first
      if (cache[plugin.homepage]) {
        cachedSkips++;
        const cached = cache[plugin.homepage];
        if (cached.found) {
          console.log(`  HOMEPAGE cached: ${plugin.homepage} -> ${cached.found}`);
          plugin.homepage = cached.found;
          modified = true;
          fixedHomepages++;
        } else {
          console.log(`  HOMEPAGE cached (not found): ${plugin.homepage}`);
        }
        continue;
      }

      console.log(`  HOMEPAGE broken (${homepageStatus || "unreachable"}): ${plugin.homepage}`);
      console.log(`  Searching for new homepage...`);

      const found = await searchHomepage(plugin.name, plugin.author);

      cache[plugin.homepage] = {
        found,
        searchedAt: new Date().toISOString(),
      };

      if (found) {
        console.log(`  HOMEPAGE found: ${found}`);
        plugin.homepage = found;
        modified = true;
        fixedHomepages++;
      } else {
        console.log(`  HOMEPAGE not found`);
      }
    }
  }

  // Remove plugins with no versions left (all downloads were 404)
  const before = registry.plugins.length;
  registry.plugins = registry.plugins.filter(
    (p) => Object.keys(p.versions).length > 0,
  );
  const removedPlugins = before - registry.plugins.length;

  if (modified || removedPlugins > 0) {
    await saveRegistry(registry);
  }

  await saveHomepageCache(cache);

  console.log(`\nDone.`);
  console.log(`  Downloads removed: ${removedDownloads}`);
  console.log(`  Plugins removed (no downloads left): ${removedPlugins}`);
  console.log(`  Homepages broken: ${brokenHomepages}`);
  console.log(`  Homepages fixed: ${fixedHomepages}`);
  console.log(`  Homepages cached (skipped search): ${cachedSkips}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
