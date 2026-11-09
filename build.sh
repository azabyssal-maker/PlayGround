#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
cd "$PROJECT_DIR"
DIST_DIR="$PROJECT_DIR/dist"

/usr/bin/time -p rm -rf "$DIST_DIR"
/usr/bin/time -p mkdir -p "$DIST_DIR"
/usr/bin/time -p cp index.html app.js avatar.js styles.css styles-avatar.css styles-features.css "$DIST_DIR/"
/usr/bin/time -p cp -a public "$DIST_DIR/public"

/usr/bin/time -p test -s "$DIST_DIR/index.html"
/usr/bin/time -p test -s "$DIST_DIR/public/models/mori.glb"
