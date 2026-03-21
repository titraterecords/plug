# Publish New Version

Step-by-step release process for the plug CLI.

## 1. Bump version

Both files must match:

- `apps/cli/package.json` → `"version"`
- `apps/cli/src/index.ts` → `const VERSION`

Use semver: patch (0.4.1) for fixes, minor (0.5.0) for features, major (1.0.0) for breaking changes.

## 2. Push and wait for CI

```bash
git add apps/cli/package.json apps/cli/src/index.ts
git commit -m "Bump CLI to X.Y.Z"
git push
```

Wait for all three CI jobs to pass: `check` (macOS), `check-windows`, `check-mac`.

CI tests the **built** `dist/index.js`, not source - so if CI passes, the npm package works.

## 3. Tag and create GitHub Release

```bash
git tag vX.Y.Z && git push origin vX.Y.Z
```

Create a release with grouped changelog:

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --notes "$(cat <<'EOF'
## Section name

- Change description

## New plugins

- Plugin Name by Author
EOF
)"
```

Changelog sections to consider:
- **New features** - commands, flags, UX improvements
- **New plugins** - added to registry since last release
- **Fixes** - bug fixes, platform fixes
- **CI** - test changes (only if notable)
- **Internal** - refactors, schema changes (only if notable)

Keep it concise. One line per change. No filler.

## 4. Publish to npm

The user runs this manually (requires npm 2FA):

```bash
cd apps/cli && npm publish --access public
```

`prepublishOnly` runs `pnpm build` automatically - no manual build step needed.

## 5. Verify

```bash
npm install -g @titrate/plug@X.Y.Z
plug --version
```

The standalone binary is built automatically by the Release workflow when the tag is pushed. `curl -fsSL plug.audio/install.sh | sh` picks up the new binary within minutes.

## Common issues

- **Version mismatch**: `package.json` and `index.ts` must have the same version string. The build bakes `index.ts` VERSION into the binary.
- **Stale dist**: If CI passes but the npm package behaves differently, the build may be stale. `prepublishOnly` prevents this - it always rebuilds before publish.
- **npm 404**: npm auth expired. Run `npm login` and retry.
- **Tag already exists**: Can't republish to npm with the same version. Bump to the next patch.
