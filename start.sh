#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
export PROJECT_DIR
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT
export STATIC_DIR="$PROJECT_DIR/dist"
WEB_META_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
DEPLOYMENT_OUTPUT="$WEB_META_DIR/deployment-output.json"

/usr/bin/time -p mkdir -p "$WEB_META_DIR"
/usr/bin/time -p test -f server.mjs
if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
fi
/usr/bin/time -p bash build.sh
/usr/bin/time -p node -e 'const fs=require("node:fs"); fs.writeFileSync(process.argv[1], JSON.stringify({project:process.env.PROJECT_DIR,directory:process.env.STATIC_DIR})+"\n")' "$DEPLOYMENT_OUTPUT"
/usr/bin/time -p node server.mjs
