#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build"
APP_DIR="$BUILD_DIR/MoveNow.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
ICONSET_DIR="$BUILD_DIR/AppIcon.iconset"

SWIFT_SOURCES=(
  "$ROOT_DIR/src/macOS/ActivityMonitor.swift"
  "$ROOT_DIR/src/macOS/EngineHost.swift"
  "$ROOT_DIR/src/macOS/WebViewHelper.swift"
  "$ROOT_DIR/src/macOS/OverlayController.swift"
  "$ROOT_DIR/src/macOS/AppDelegate.swift"
  "$ROOT_DIR/src/macOS/main.swift"
)

SWIFT_FRAMEWORKS=(
  -framework Cocoa
  -framework WebKit
  -framework JavaScriptCore
  -framework Carbon
  -framework IOKit
  -framework ServiceManagement
)

echo "Cleaning build directory..."
rm -rf "$APP_DIR" "$ICONSET_DIR"
mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

echo "Generating AppIcon.icns..."
swift "$ROOT_DIR/scripts/generate_icon.swift" "$ICONSET_DIR"
iconutil -c icns "$ICONSET_DIR" -o "$RESOURCES_DIR/AppIcon.icns"
rm -rf "$ICONSET_DIR"

echo "Compiling Swift host..."
if [[ "${UNIVERSAL:-0}" == "1" ]]; then
  swiftc -O -target arm64-apple-macosx13.0 "${SWIFT_FRAMEWORKS[@]}" "${SWIFT_SOURCES[@]}" -o "$BUILD_DIR/MoveNow-arm64"
  swiftc -O -target x86_64-apple-macosx13.0 "${SWIFT_FRAMEWORKS[@]}" "${SWIFT_SOURCES[@]}" -o "$BUILD_DIR/MoveNow-x86_64"
  lipo -create -output "$MACOS_DIR/MoveNow" "$BUILD_DIR/MoveNow-arm64" "$BUILD_DIR/MoveNow-x86_64"
  rm -f "$BUILD_DIR/MoveNow-arm64" "$BUILD_DIR/MoveNow-x86_64"
else
  HOST_ARCH="$(uname -m)"
  swiftc -O -target "${HOST_ARCH}-apple-macosx13.0" "${SWIFT_FRAMEWORKS[@]}" "${SWIFT_SOURCES[@]}" -o "$MACOS_DIR/MoveNow"
fi

echo "Bundling UI resources and Info.plist..."
cp "$ROOT_DIR/src/macOS/Info.plist" "$CONTENTS_DIR/Info.plist"
printf "APPL????" > "$CONTENTS_DIR/PkgInfo"
cp -R "$ROOT_DIR/src/ui" "$RESOURCES_DIR/ui"

echo "Signing MoveNow.app (ad-hoc)..."
codesign --force --deep --sign - "$APP_DIR"

echo "Built successfully: $APP_DIR"
