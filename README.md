# plug

CLI plugin manager for free audio plugins on macOS.

```bash
plug search reverb
plug install ott
plug list
plug info ott
plug upgrade
plug uninstall ott
```

All commands support `--json` for scripted and agent use.

## Install

```bash
npm install -g @titrate/plug
```

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

## Thank you

To the plugin developers who build and give away their work for free - Xfer Records, Surge Synth Team, Digital Suburban, Tokyo Dawn Labs, and everyone else making tools for musicians without asking for anything in return. This project exists because of your generosity.

To the maintainers of Homebrew, npm, and the broader ecosystem of package managers whose design and decades of work shaped how we think about software distribution. The DMG and PKG handling in plug draws directly from patterns established by Homebrew Cask.
