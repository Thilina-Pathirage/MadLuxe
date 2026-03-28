#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/package"

BACKEND_LOG="${BACKEND_LOG:-/tmp/madlaxue-backend-e2e.log}"
FRONTEND_LOG="${FRONTEND_LOG:-/tmp/madlaxue-frontend-e2e.log}"

load_env_file() {
  local env_file="$1"
  if [[ -f "$env_file" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

wait_for_url() {
  local url="$1"
  local name="$2"
  local retries="${3:-90}"
  local delay_secs="${4:-1}"

  for ((i = 1; i <= retries; i++)); do
    if curl -sf "$url" >/dev/null; then
      echo "[ok] $name is ready: $url"
      return 0
    fi
    sleep "$delay_secs"
  done

  echo "[error] $name did not become ready: $url"
  return 1
}

cleanup() {
  local exit_code=$?
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  wait || true
  if [[ $exit_code -ne 0 ]]; then
    echo "[info] Backend log:  $BACKEND_LOG"
    echo "[info] Frontend log: $FRONTEND_LOG"
    echo "[info] Playwright report: $FRONTEND_DIR/playwright-report/index.html"
    echo "[info] Open report: cd $FRONTEND_DIR && npx playwright show-report"
    echo "[info] If traces exist: cd $FRONTEND_DIR && find test-results -name trace.zip -print"
  fi
  exit $exit_code
}

trap cleanup EXIT INT TERM

load_env_file "$BACKEND_DIR/.env"
load_env_file "$FRONTEND_DIR/.env.test.local"

: "${PLAYWRIGHT_BASE_URL:=http://localhost:3000}"
: "${PORT:=5000}"
: "${FRONTEND_PORT:=3000}"

# Keep all E2E API targets aligned with backend .env PORT.
export E2E_API_BASE_URL="http://localhost:${PORT}/api"
export NEXT_PUBLIC_API_URL="$E2E_API_BASE_URL"

if [[ -z "${ADMIN_USERNAME:-}" || -z "${ADMIN_PASSWORD:-}" ]]; then
  echo "[error] ADMIN_USERNAME/ADMIN_PASSWORD missing in backend/.env"
  exit 1
fi

export E2E_ADMIN_USERNAME="${E2E_ADMIN_USERNAME:-$ADMIN_USERNAME}"
export E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-$ADMIN_PASSWORD}"

rm -f "$BACKEND_LOG" "$FRONTEND_LOG"

echo "[step] Starting backend on port $PORT ..."
(
  cd "$BACKEND_DIR"
  npm run dev >"$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!

wait_for_url "http://localhost:${PORT}/api/health" "Backend API"

echo "[step] Resetting data (wipe + seed) ..."
(
  cd "$BACKEND_DIR"
  npm run wipe
  npm run seed
)

echo "[step] Starting frontend on http://localhost:3000 ..."
(
  cd "$FRONTEND_DIR"
  PORT="$FRONTEND_PORT" npm run dev >"$FRONTEND_LOG" 2>&1
) &
FRONTEND_PID=$!

wait_for_url "${PLAYWRIGHT_BASE_URL}/authentication/login" "Frontend app"

echo "[step] Running Playwright happy path suite ..."
(
  cd "$FRONTEND_DIR"
  npm run test:e2e -- tests/e2e/happy-path.spec.ts
)

echo "[done] Happy path suite completed successfully."
