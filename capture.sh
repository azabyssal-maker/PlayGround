#!/usr/bin/env bash
set -euo pipefail

: "${CAPTURE_URL:?CAPTURE_URL is required}"
: "${CAPTURE_DIR:?CAPTURE_DIR is required}"
SESSION="capture-$$"
BROWSER_OPEN=false
run() { /usr/bin/time -p "$@"; }

close_browser() {
  if [[ "$BROWSER_OPEN" == true ]]; then
    run playwright-cli -s="$SESSION" close >/dev/null 2>&1 || true
    BROWSER_OPEN=false
  fi
}
trap close_browser EXIT

run mkdir -p "$CAPTURE_DIR"
if ! run playwright-cli -s="$SESSION" open "$CAPTURE_URL"; then
  echo 'Browser launch or navigation failed; capture can be retried.' >&2
  exit 75
fi
BROWSER_OPEN=true

# Wait for the app's visible game UI and WebGL canvas, and reject blank/error renders.
if ! run playwright-cli -s="$SESSION" eval 'async () => { await new Promise((resolve, reject) => { const started = Date.now(); const check = () => { const canvas = document.querySelector("canvas"); const panel = document.querySelector("#panel"); if (canvas && canvas.width > 0 && canvas.height > 0 && panel && document.body.innerText.includes("TESSERACT RUNNER")) return resolve(true); if (Date.now() - started > 15000) return reject(new Error("Game UI/canvas did not render")); setTimeout(check, 200); }; check(); }); return {title: document.title, canvas: !!document.querySelector("canvas")}; }'; then
  echo 'The page loaded but the game UI did not render.' >&2
  exit 1
fi

run playwright-cli -s="$SESSION" resize 1280 800
run playwright-cli -s="$SESSION" screenshot --filename="$CAPTURE_DIR/final-desktop.png"
run playwright-cli -s="$SESSION" resize 390 844
run playwright-cli -s="$SESSION" screenshot --filename="$CAPTURE_DIR/final-mobile.png"
run test -s "$CAPTURE_DIR/final-desktop.png"
run test -s "$CAPTURE_DIR/final-mobile.png"
close_browser
