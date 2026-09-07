#!/usr/bin/env bash
# Runs on jasper after the tree has been rsynced. Rebuilds the container.
# SQLite lives in ./data (volume) and is never overwritten by git/rsync.
set -euo pipefail

export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DOCKER_HOST="${DOCKER_HOST:-unix://${XDG_RUNTIME_DIR}/docker.sock}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
	echo "missing $ROOT/.env" >&2
	exit 1
fi

mkdir -p data/backups
if [[ -f data/geeft.sqlite ]]; then
	stamp="$(date -u +%Y%m%dT%H%M%SZ)"
	cp -a data/geeft.sqlite "data/backups/geeft.${stamp}.sqlite"
	# keep the 10 newest copies
	mapfile -t old < <(ls -1t data/backups/geeft.*.sqlite 2>/dev/null | tail -n +11)
	if ((${#old[@]} > 0)); then
		rm -f -- "${old[@]}"
	fi
fi

docker compose up --build -d

echo "waiting for health..."
for _ in $(seq 1 40); do
	status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' geeft 2>/dev/null || echo missing)"
	if [[ "$status" == healthy ]]; then
		echo "geeft is healthy"
		docker compose ps
		exit 0
	fi
	if [[ "$status" == exited || "$status" == dead ]]; then
		docker logs geeft --tail 80 >&2
		exit 1
	fi
	sleep 3
done

echo "container did not become healthy" >&2
docker logs geeft --tail 80 >&2
exit 1
