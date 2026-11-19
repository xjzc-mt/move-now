#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: MoveNow currently supports macOS (Darwin) only." >&2
  exit 1
fi

if ! command -v swiftc >/dev/null 2>&1; then
  echo "Error: Apple Command Line Tools (swiftc) not found." >&2
  echo "Run 'xcode-select --install' first, then re-run this script." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
"$ROOT_DIR/scripts/build.sh"

SRC_APP="$ROOT_DIR/build/MoveNow.app"
if [[ -w "/Applications" ]]; then
  DEST_DIR="/Applications"
else
  DEST_DIR="$HOME/Applications"
  mkdir -p "$DEST_DIR"
fi
DEST_APP="$DEST_DIR/MoveNow.app"

# Stop running MoveNow cleanly before replacing bundle
pkill -x "MoveNow" 2>/dev/null || true
sleep 0.3

rm -rf "$DEST_APP"
cp -R "$SRC_APP" "$DEST_APP"
xattr -cr "$DEST_APP" 2>/dev/null || true

echo "Installed MoveNow to: $DEST_APP"
open "$DEST_APP"
echo "MoveNow is now running in your top menu bar."
