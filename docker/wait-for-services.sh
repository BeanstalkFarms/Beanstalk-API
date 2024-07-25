#!/bin/sh

# This script is used by the compose file as an entrypoint proxy for the api container.
# Waits for postgres to be available before running any following startup commands.

set -e

host=$1
port=$2
shift
shift
cmd="$@"

until pg_isready -h "$host" -p "$port"; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - proceeding to start container"
exec $cmd
