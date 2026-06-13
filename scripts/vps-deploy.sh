#!/usr/bin/env bash
set -euo pipefail

git fetch origin main
git reset --hard origin/main

docker compose -f docker-compose.prod.yml build --pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f
