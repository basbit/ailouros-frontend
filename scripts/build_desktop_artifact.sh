#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: build_desktop_artifact.sh <version>" >&2
  exit 2
fi

VERSION="$1"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

DIST_BUILD_DIR="dist"
DIST_OUTPUT_DIR="release-artifacts"
ARCHIVE_NAME="ailouros-frontend-dist-${VERSION}.tar.gz"
ARCHIVE_PATH="$DIST_OUTPUT_DIR/$ARCHIVE_NAME"

mkdir -p "$DIST_OUTPUT_DIR"

if [[ ! -d "node_modules" ]]; then
  npm ci
fi
npm run build

if [[ ! -d "$DIST_BUILD_DIR" ]]; then
  echo "build_desktop_artifact: dist/ not produced by 'npm run build'" >&2
  exit 1
fi

TAR_BIN=$(command -v gtar || command -v tar)
"$TAR_BIN" -czf "$ARCHIVE_PATH" "$DIST_BUILD_DIR"

if grep -arE "sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}" "$DIST_BUILD_DIR" >/dev/null 2>&1; then
  echo "build_desktop_artifact: refusing to publish — secret-shaped strings detected in dist" >&2
  rm -f "$ARCHIVE_PATH"
  exit 1
fi

shasum -a 256 "$ARCHIVE_PATH" | awk '{print $1}' > "${ARCHIVE_PATH}.sha256"

echo "==> built $(basename "$ARCHIVE_PATH")"
echo "    size:   $(wc -c < "$ARCHIVE_PATH" | awk '{print $1}') bytes"
echo "    sha256: $(cat "${ARCHIVE_PATH}.sha256")"
