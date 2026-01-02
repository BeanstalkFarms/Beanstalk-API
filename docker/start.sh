#!/bin/bash

cd $(dirname "$0")

DOCKER_ENV=$1
KOAJS_PORT=$2
POSTGRES_PORT=$3
REDIS_PORT=$4
SERVICES=("${@:5}")
if [ -z "$DOCKER_ENV" ] || [ -z "$KOAJS_PORT" ] || [ -z "$POSTGRES_PORT" ] || [ -z "$REDIS_PORT" ]; then
  DOCKER_ENV="dev"
  KOAJS_PORT="4000"
  POSTGRES_PORT="6432"
  REDIS_PORT="7379"
fi

export DOCKER_ENV
export KOAJS_PORT
export POSTGRES_PORT
export REDIS_PORT

# Can optionally provide a specific service to start. Defaults to all
docker compose -p web-api-$DOCKER_ENV up -d ${SERVICE:+ $SERVICE}
