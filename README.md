<p align="center">
  <img src="https://raw.githubusercontent.com/titraterecords/plug/main/docs/assets/plug.audio.png" alt="plug.audio" />
</p>

# plug

Open source command line tool and plugin registry for [plug.audio](https://plug.audio).

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

For Microsoft Windows users:

```bash
npm install -g @titrate/plug
```

## Plugin folder resolution

Installing plugins to the right folder is always a challenge. Even when you get it right, it's easy to end up with VST3, AU, VST2 and other duplicated copies of the same plugin showing up in your DAW.

We have worked hard on path resolution and normalisation, but something might still go wrong. If it does, please [let us know](https://github.com/titraterecords/plug/issues/new).

The following is our best attempt at covering every case. If you have improvements or suggestions, please [open an issue](https://github.com/titraterecords/plug/issues/new).

### VST3 and Audio Units on macOS

On macOS, VST3 plugins generally belong in `/Library/Audio/Plug-Ins/VST3/`. The problem is that this folder requires administrator privileges, and typing your password every time you install a plugin is not a good experience.

For that reason we always prioritise installation to the user's home folder at `~/Library/Audio/Plug-Ins/VST3/`. Audio Units follow the same pattern at `~/Library/Audio/Plug-Ins/Components/`.

In some cases plugins need to install presets or auxiliary files to system folders, in which case we have no choice but to ask for your password. We try to make this as painless as possible.

### VST3 on Windows

Windows VST paths have historically been confusing, but with VST3 Steinberg defined a clear standard: `C:\Program Files\Common Files\VST3\` is the official location. This is documented in the [VST3 SDK specification](https://steinbergmedia.github.io/vst3_dev_portal/pages/Technical+Documentation/Locations+Format/Plugin+Locations.html) and every major DAW scans this folder by default.

We follow this standard. During our testing the system did not require administrator privileges to write to this folder, but we suspect some fresh Windows installations might. There is a safeguard in place: before downloading anything, we check write permissions and if they are missing we let you know to run your terminal as administrator.

Some plugins on Windows are distributed as `.exe` installers (NSIS format) rather than plain `.zip` files. To extract these without running the installer, we use [7-Zip](https://7-zip.org). If 7-Zip is not installed, we install it automatically through `winget` (the package manager that ships with Windows 10 and 11). This is a one-time thing and happens silently in the background.

#### Ableton Live on Windows

We detect Ableton Live's plugin scan configuration by reading its preferences file. Ableton lets you choose between the system VST3 folder and a custom folder, and some users only enable the custom folder.

If Ableton has the system folder enabled, we install there for maximum DAW compatibility. If Ableton only has a custom folder enabled and the system folder is disabled, we install to the custom folder and let you know that other DAWs may not find plugins there.

This detection currently works for Ableton Live 10, 11 and 12 on Windows. macOS support is planned. If you use a different DAW and have thoughts on how we should handle scan paths, please [tell us](https://github.com/titraterecords/plug/issues/new).

### CLAP and LV2

We have a lot of respect for the people behind CLAP and LV2. It's great to see new formats pushing the boundaries, especially on Linux. We believe that more people will be using Linux for music production in the future and it's important to support the work being done there.

That said, we have not had enough time to thoroughly test these formats yet. macOS and Windows are the largest audience and those two operating systems are giving us plenty of headaches as it is.

We install CLAP plugins to the standard paths (`/Library/Audio/Plug-Ins/CLAP/` on macOS, `C:\Program Files\Common Files\CLAP\` on Windows, `~/.clap/` on Linux) and LV2 plugins to their standard locations as well. If something doesn't work right with these formats, please [open an issue](https://github.com/titraterecords/plug/issues/new).

### Linux

We have not tested Linux installs in depth yet. We default to the standard paths from the VST3 and LV2 specs (`~/.vst3/`, `~/.lv2/`, `~/.clap/`). We trust that Linux users are technical enough to sort things out if something goes wrong, and we welcome PRs from anyone who wants to improve Linux support. The way Linus intended.

## How the plugin registry works

When we started building plug, we needed a registry of free audio plugins with download URLs, checksums, and platform metadata. We quickly discovered that other people had been thinking about this problem too.

[StudioRack](https://studiorack.github.io/studiorack-site/) and the [Open Audio Stack](https://github.com/open-audio-stack) project have built an open, CC0-licensed plugin registry and specification. [OwlPlug](https://github.com/DropSnorz/OwlPlug) is a desktop plugin manager with its own registry and features like VirusTotal scanning for safety. These projects are doing important work for the audio community.

Our goal with plug is to make things as simple as possible and move fast. To do that we started our own registry from scratch so we could iterate quickly and support the features we are planning without being constrained by someone else's format.

Currently we pull some plugin data from the StudioRack registry. We plan to pull from OwlPlug's registry as well. On top of that we maintain our own list of plugins sourced from public download links on developer websites and GitHub releases. Plugins behind registration walls (like Gumroad or Vital's website) can't be linked directly, so those are excluded for now.

The registry is a single `registry.json` file in this repository. A build script fetches plugin metadata from various sources, verifies download URLs and checksums, and produces the final registry. The idea is to constantly evolve and experiment in the pursuit of finding what works best, and hopefully give some love back to the audio community.

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

### Project structure

- `apps/cli` - The `plug` command line tool
- `registry.json` - The plugin registry
- `apps/scripts/registry/build.ts` - The script that builds the registry

## Releasing

Push to `main` triggers CI (type-check, lint, tests on macOS and Windows).

To publish a new version:

1. Bump version in `apps/cli/package.json` and `apps/cli/src/index.ts`
2. Commit and push
3. Publish to npm: `cd apps/cli && pnpm build && npm publish --access public --auth-type=web`
4. Tag the release: `git tag v0.x.x && git push origin v0.x.x`

The tag triggers a GitHub Actions workflow that builds standalone binaries for macOS (arm64, x64), Linux (x64, arm64), and Windows (x64) using `bun build --compile`. Binaries are uploaded to a GitHub Release automatically.

The install script (`install.sh`) always fetches the latest release, no manual updates needed.

## Thank you

To the plugin developers who build and give away their work for free. Xfer Records, Surge Synth Team, Digital Suburban, Tokyo Dawn Labs, DISTRHO, and everyone else making tools for musicians without asking for anything in return. This project exists because of your generosity.

To the maintainers of Homebrew, npm, and the broader ecosystem of package managers whose design and decades of work shaped how we think about software distribution. The DMG and PKG handling in plug draws directly from patterns established by Homebrew Cask.

To [StudioRack](https://studiorack.github.io/studiorack-site/), the [Open Audio Stack](https://github.com/open-audio-stack) project, and [OwlPlug](https://github.com/DropSnorz/OwlPlug) for building open plugin registries and tools. Their work directly shaped our thinking on multi-platform support and plugin distribution. If you care about open audio infrastructure, check out what they are doing.
