#!/bin/bash
set -o pipefail

export PATH="/Users/guillaumedemerges/.nvm/versions/node/v22.14.0/bin:/usr/bin:/bin:/usr/local/bin"

cd /Users/guillaumedemerges/Dev/hub_data

echo "=========================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting daily SerieBox update"
echo "=========================================="

RUN_LOG=$(mktemp)
make update 2>&1 | tee "$RUN_LOG"
BUILD_STATUS=${PIPESTATUS[0]}

notify() {
  local title="$1"
  local msg="$2"
  osascript -e "display notification \"$msg\" with title \"$title\"" 2>/dev/null || true
}

if [ "$BUILD_STATUS" -ne 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Build failed (exit $BUILD_STATUS)"
  notify "HUB LIFE — SerieBox" "Build failed (exit $BUILD_STATUS)"
  rm -f "$RUN_LOG"
  exit "$BUILD_STATUS"
fi

if grep -q "PHPSESSID expired" "$RUN_LOG"; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ PHPSESSID expired — refresh SERIEBOX_COOKIES in web/.env"
  notify "HUB LIFE — SerieBox" "PHPSESSID expiré, refresh le cookie dans web/.env"
  rm -f "$RUN_LOG"
  exit 2
fi

if grep -q "Utilisation des données existantes" "$RUN_LOG"; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ SerieBox download failed (fell back to existing CSVs)"
  notify "HUB LIFE — SerieBox" "Téléchargement échoué, données non rafraîchies"
  rm -f "$RUN_LOG"
  exit 3
fi

rm -f "$RUN_LOG"

# Track per-game playtime deltas (snapshot + diff vs previous day)
( cd web && npm run --silent track:play-deltas ) || {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠ track:play-deltas failed (non-fatal)"
  notify "HUB LIFE — SerieBox" "Track play-deltas a échoué"
}

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ Done"
