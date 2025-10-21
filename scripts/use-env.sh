#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_DOCKER="$ROOT_DIR/.env.local.docker"
ENV_VERCEL="$ROOT_DIR/.env.local.vercel"
TARGET="$ROOT_DIR/.env.local"

usage() {
  echo "Usage: $0 <docker|vercel>" >&2
  exit 1
}

[[ $# -eq 1 ]] || usage

case "$1" in
  docker)
    [[ -f "$ENV_DOCKER" ]] || { echo "Missing $ENV_DOCKER"; exit 1; }
    cp "$ENV_DOCKER" "$TARGET"
    echo "Switched .env.local -> .env.local.docker"
    ;;
  vercel)
    [[ -f "$ENV_VERCEL" ]] || { echo "Missing $ENV_VERCEL"; exit 1; }
    cp "$ENV_VERCEL" "$TARGET"
    echo "Switched .env.local -> .env.local.vercel"
    ;;
  *)
    usage
    ;;

esac
