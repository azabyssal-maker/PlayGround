#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3000}"
DIST_DIR="$PROJECT_DIR/dist"
DEPLOYMENT_FILE="/home/runner/work/_temp/omgithub-web/deployment-output.json"

run() { /usr/bin/time -p "$@"; }

[[ "$PORT" =~ ^[0-9]+$ ]] || { echo "PORT must be numeric: $PORT" >&2; exit 1; }
[[ -f "$PROJECT_DIR/app/index.html" && -f "$PROJECT_DIR/app/src.js" ]] || { echo 'Missing app/index.html or app/src.js' >&2; exit 1; }

# Three.js is loaded from its browser ESM CDN URL; this static project has no npm dependencies.
run mkdir -p "$DIST_DIR" "$(dirname "$DEPLOYMENT_FILE")"
run cp "$PROJECT_DIR/app/index.html" "$DIST_DIR/index.html"
run cp "$PROJECT_DIR/app/src.js" "$DIST_DIR/src.js"

# Normalize the static entry assets during build, leaving authored source files untouched.
run node --input-type=module - "$DIST_DIR" <<'NODE'
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const dir = process.argv[2];
const htmlPath = path.join(dir, 'index.html');
const jsPath = path.join(dir, 'src.js');
let html = await readFile(htmlPath, 'utf8');
let js = await readFile(jsPath, 'utf8');
html = html.replace(':html,body{', 'html,body{');
js = js.replaceAll('e.key.toLower]', 'e.key.toLowerCase()]')
       .replaceAll('e.prevent();', 'e.preventDefault();')
       .replace(/\s*<\/script>\s*$/, '\n');
await writeFile(htmlPath, html);
await writeFile(jsPath, js);
NODE
run node --check "$DIST_DIR/src.js"
run node - "$PROJECT_DIR" "$DIST_DIR" "$DEPLOYMENT_FILE" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const project = path.resolve(process.argv[2]);
const directory = path.resolve(process.argv[3]);
const output = process.argv[4];
if (!directory.startsWith(project + path.sep)) throw new Error('Built directory must be inside project directory');
fs.writeFileSync(output, JSON.stringify({ project, directory }, null, 2) + '\n');
NODE

cd "$DIST_DIR"
exec /usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0
