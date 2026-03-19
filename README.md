<p align="center">
  <img src="https://raw.githubusercontent.com/titraterecords/plug/main/docs/assets/plug.audio.png" alt="plug.audio" />
</p>

# plug

Open source CLI tool and plugin registry for [plug.audio](https://plug.audio).

```bash
plug search reverb
plug install ott
plug list
plug info ott
plug upgrade
plug uninstall ott
```

## Install

macOS / Linux:

```bash
curl -fsSL plug.audio/install.sh | sh
```

Windows:

```bash
npm install -g @titrate/plug
```

## Plugin registry

Plugins are sourced from a curated list of developer websites, GitHub repositories, and [Open Audio Stack](https://github.com/open-audio-stack) registries.

To request a plugin listing or delisting, [create an issue](https://github.com/titraterecords/plug/issues/new).

## Plugin paths

Plugins install to user-writable locations when possible to avoid password prompts.

| Format | macOS | Windows | Linux |
|--------|-------|---------|-------|
| VST3 | `~/Library/Audio/Plug-Ins/VST3/` | `C:\Program Files\Common Files\VST3\` | `~/.vst3/` |
| AU | `~/Library/Audio/Plug-Ins/Components/` | - | - |
| CLAP | `/Library/Audio/Plug-Ins/CLAP/` | `C:\Program Files\Common Files\CLAP\` | `~/.clap/` |
| LV2 | - | - | `~/.lv2/` |

On Windows, if write permissions are missing, plug prompts you to run your terminal as administrator.

Ableton Live on Windows can override the default VST3 scan path. Plug reads Ableton's preferences (Live 10, 11, 12) and installs to the active scan folder.

Some plugins require presets or auxiliary files in system folders, which may require your password.

If something goes wrong with path resolution, [open an issue](https://github.com/titraterecords/plug/issues/new).

## Structure

- `apps/cli` - The `plug` CLI
- `packages/registry-schema` - Zod schema for the plugin registry
- `registry.json` - Plugin registry (single source of truth)

## Development

```bash
pnpm install
pnpm test
pnpm lint
pnpm type-check
```

Run the CLI locally:

```bash
cd apps/cli
pnpm dev -- search reverb
```

## Releasing

Push to `main` triggers CI (type-check, lint, tests on macOS).

To publish a new version:

1. Bump version in `apps/cli/package.json` and `apps/cli/src/index.ts`
2. Commit and push
3. Publish to npm: `cd apps/cli && pnpm build && npm publish --access public --auth-type=web`
4. Tag the release: `git tag v0.x.x && git push origin v0.x.x`

The tag triggers a GitHub Actions workflow that builds standalone binaries for macOS (arm64, x64), Linux (x64, arm64), and Windows (x64) using `bun build --compile`. Binaries are uploaded to a GitHub Release automatically.

The install script (`install.sh`) always fetches the latest release - no manual updates needed.

## Thank you

To the plugin developers who build and give away their work for free - [Xfer Records](https://xferrecords.com), [Surge Synth Team](https://surge-synth-team.org), [Digital Suburban](https://asb2m10.github.io/dexed/), [Tokyo Dawn Labs](https://www.tokyodawn.net), and everyone else making tools for musicians without asking for anything in return. This project exists because of your generosity.

To the maintainers of Homebrew, npm, and the broader ecosystem of package managers whose design and decades of work shaped how we think about software distribution. The DMG and PKG handling in plug draws directly from patterns established by Homebrew Cask.

To [StudioRack](https://studiorack.github.io/studiorack-site/) and the [Open Audio Stack](https://github.com/open-audio-stack) project for working on an open plugin registry standard. Important work for the community.
