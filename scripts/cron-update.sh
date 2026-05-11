#!/bin/bash
set -e

export PATH="/Users/guillaumedemerges/.nvm/versions/node/v22.14.0/bin:/usr/bin:/bin:/usr/local/bin"

cd /Users/guillaumedemerges/Dev/hub_data

echo "=========================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting daily SerieBox update"
echo "=========================================="

make update

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done"
