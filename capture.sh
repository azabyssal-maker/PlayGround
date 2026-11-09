#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory}"
: "${RUNTIME_DIR:?RUNTIME_DIR must point to the worker runtime}"

run_timed() {
  /usr/bin/time -p "$@"
}

CAPTURE_DIR="$(run_timed realpath -m -- "$CAPTURE_DIR")"
case "$CAPTURE_DIR/" in
  "$PROJECT_DIR/"*)
    echo 'CAPTURE_DIR must be outside the project source directory.' >&2
    exit 1
    ;;
esac
run_timed mkdir -p -- "$CAPTURE_DIR"

export CAPTURE_URL CAPTURE_DIR
export CAPTURE_READY_SELECTOR="${CAPTURE_READY_SELECTOR:-#messages .assistant-row .bubble}"
export CAPTURE_STRICT="${CAPTURE_STRICT:-1}"
run_timed node "${RUNTIME_DIR}/scripts/default-capture.mjs"
