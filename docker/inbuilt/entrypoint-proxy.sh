#!/bin/sh

# This script is used by the compose file as an entrypoint proxy for the api container.
# Waits for postgres and redis to be available before running any following startup commands.

set -e

pg_host=$1
pg_port=$2
redis_host=$3
redis_port=$4
shift 4
cmd="$@"

echo "Entrypoint script for $NODE_ENV"

# Wait for Postgres
echo "Waiting for Postgres at $pg_host:$pg_port..."
until pg_isready -h "$pg_host" -p "$pg_port"; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done
echo "Postgres is up"

# Wait for Redis
echo "Waiting for Redis at $redis_host:$redis_port..."
until redis-cli -h "$redis_host" -p "$redis_port" ping 2>&1 | grep -q "PONG"; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done
echo "Redis is up"

npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

echo "Postgres is up - proceeding to api entrypoint"
exec $cmd
