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
npm install -g @plug/cli
```

## Structure

- `apps/cli` - The `plug` CLI
- `packages/registry-schema` - Zod schema for the plugin registry
- `tap/` - Plugin registry (`registry.json`)

## Development

```bash
pnpm install
pnpm test
pnpm lint
pnpm type-check
```

Run the CLI locally:

```bash
pnpm --filter @plug/cli dev -- search reverb
```
