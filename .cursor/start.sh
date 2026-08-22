#!/usr/bin/env bash
# Per-boot startup for oc-selective: ensure the local PostgreSQL daemon is running.
# Runs on every environment start; must be idempotent and return after readiness.
set -euo pipefail

PG_VERSION="$(pg_lsclusters -h | awk 'NR==1 {print $1}')"
PG_CLUSTER="$(pg_lsclusters -h | awk 'NR==1 {print $2}')"
: "${PG_VERSION:=16}"
: "${PG_CLUSTER:=main}"

echo "[start] Ensuring PostgreSQL cluster ${PG_VERSION}/${PG_CLUSTER} is online..."
if ! pg_lsclusters -h | awk '{print $4}' | grep -q online; then
  sudo pg_ctlcluster "$PG_VERSION" "$PG_CLUSTER" start
fi

echo "[start] Waiting for PostgreSQL to accept connections..."
for _ in $(seq 1 30); do
  if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    echo "[start] PostgreSQL is ready."
    exit 0
  fi
  sleep 1
done

echo "[start] PostgreSQL did not become ready in time." >&2
exit 1
