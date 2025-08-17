#!/bin/sh
set -e

host="$1"
shift
cmd="$@"

echo "Waiting for Postgres at $host:5432..."

until nc -z "$host" 5432; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - executing command: $cmd"
exec $cmd