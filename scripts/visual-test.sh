#!/usr/bin/env bash
#
# Runs the visual-regression suite inside the pinned Playwright container.
#
# Why a container at all: screenshot comparison is only valid when the renderer
# is identical between the run that produced the baseline and the run checking
# against it. Font packages, freetype/fontconfig versions and hinting defaults
# all differ between macOS, a bare GitHub runner and this image, and each of
# those shifts glyph antialiasing by a pixel or two -- enough to fail an exact
# comparison for reasons unrelated to the component. Pinning the image makes a
# baseline generated on a laptop and one checked in CI the same measurement.
#
# Usage:
#   scripts/visual-test.sh              # compare against committed baselines
#   scripts/visual-test.sh --update     # regenerate baselines
#   scripts/visual-test.sh <extra args> # forwarded to `playwright test`
set -euo pipefail

# Must match the @playwright/test version in package.json. A mismatch changes
# the bundled browser build, which changes rendering.
IMAGE="mcr.microsoft.com/playwright:v1.60.0-noble"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! docker info >/dev/null 2>&1; then
  echo "error: Docker is not running. The visual suite requires it -- see docs/VISUAL_TESTING.md" >&2
  exit 1
fi

EXPECTED_PW_VERSION="${IMAGE##*:v}"
EXPECTED_PW_VERSION="${EXPECTED_PW_VERSION%%-*}"
ACTUAL_PW_VERSION="$(node -p "require('$REPO_ROOT/node_modules/@playwright/test/package.json').version")"
if [[ "$EXPECTED_PW_VERSION" != "$ACTUAL_PW_VERSION" ]]; then
  echo "error: image pins Playwright $EXPECTED_PW_VERSION but node_modules has $ACTUAL_PW_VERSION." >&2
  echo "       Update IMAGE in this script and .github/workflows/visual.yml together." >&2
  exit 1
fi

# node_modules is masked with an anonymous volume: the host tree is macOS-built,
# and its platform-specific binaries (esbuild, rollup) cannot execute in Linux.
# The container installs its own into that volume instead.
# Allocate a TTY only when there is one. `docker run -it` aborts with "the input
# device is not a TTY" under CI and any non-interactive shell.
TTY_FLAGS=()
if [[ -t 0 && -t 1 ]]; then
  TTY_FLAGS=(-it)
fi

# ${arr[@]+"${arr[@]}"} rather than a bare "${arr[@]}": macOS ships bash 3.2,
# where expanding an empty array under `set -u` is an "unbound variable" error.
#
# --store-dir keeps pnpm's store inside the container's own filesystem. The repo
# is bind-mounted at /work, so the default location would write a .pnpm-store
# directory into the working tree and leave it there as untracked noise.
exec docker run --rm ${TTY_FLAGS[@]+"${TTY_FLAGS[@]}"} \
  -v "$REPO_ROOT":/work \
  -v /work/node_modules \
  -w /work \
  -e CI="${CI:-}" \
  "$IMAGE" \
  bash -c 'corepack enable \
    && pnpm install --frozen-lockfile --store-dir /tmp/pnpm-store \
    && pnpm exec playwright test --config playwright.visual.config.ts "$@"' \
  playwright-visual "$@"
