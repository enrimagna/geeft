#!/usr/bin/env bash
# Deploy the working tree to jasper and rebuild production.
# Usage (from Ambrogio, or any machine with SSH to jasper):
#   ./scripts/deploy.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${GEEFT_DEPLOY_HOST:-enrico@jasper.nalipa.me}"
DEST="${GEEFT_DEPLOY_DIR:-/home/enrico/docker/geeft}"

rsync -az --delete \
	--exclude '.git/' \
	--exclude 'node_modules/' \
	--exclude 'build/' \
	--exclude '.svelte-kit/' \
	--exclude '.grok/' \
	--exclude '.env' \
	--exclude 'data/' \
	"$ROOT/" "$HOST:$DEST/"

ssh -o BatchMode=yes "$HOST" "bash $DEST/scripts/remote-up.sh"
