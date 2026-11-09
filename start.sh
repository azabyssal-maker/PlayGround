#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"

run_timed() {
  /usr/bin/time -p "$@"
}

run_timed pwd

# This project is a dependency-free Node static server. If a package manifest is
# added later, install its dependencies and run its build script when present.
if [[ -f package.json ]]; then
  if [[ -f package-lock.json || -f npm-shrinkwrap.json ]]; then
    run_timed npm ci
  else
    run_timed npm install
  fi
  HAS_BUILD="$(run_timed node --input-type=module -e 'import { readFileSync } from "node:fs"; const p = JSON.parse(readFileSync("package.json", "utf8")); process.stdout.write(p.scripts?.build ? "yes" : "no")')"
  if [[ "$HAS_BUILD" == yes ]]; then
    run_timed npm run build
  fi
fi

STATIC_DIR="$PROJECT_DIR"
DEPLOYMENT_FILE="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}/deployment-output.json"
run_timed mkdir -p -- "$(dirname -- "$DEPLOYMENT_FILE")"
PROJECT_DIR="$PROJECT_DIR" STATIC_DIR="$STATIC_DIR" DEPLOYMENT_FILE="$DEPLOYMENT_FILE" run_timed node --input-type=module -e '
  import { writeFileSync } from "node:fs";
  writeFileSync(process.env.DEPLOYMENT_FILE, JSON.stringify({
    project: process.env.PROJECT_DIR,
    directory: process.env.STATIC_DIR
  }));
'

export PORT
run_timed node server.mjs
