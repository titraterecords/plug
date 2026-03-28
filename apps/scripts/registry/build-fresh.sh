#!/bin/sh
# Rebuilds the registry from scratch: reset, import all sources, build.
set -e

tsx registry/reset.ts
pnpm import:studiorack:mac
pnpm import:studiorack:linux
pnpm import:studiorack:win
pnpm import:github
pnpm import:manual
pnpm import:m4l
pnpm build:registry
