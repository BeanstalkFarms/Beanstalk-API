#!/bin/bash

cd $(dirname "$0")

DOCKER_ENV=$1
KOAJS_PORT=$2
SERVICE=$3
if [ -z "$DOCKER_ENV" ] || [ -z "$KOAJS_PORT" ]; then
  DOCKER_ENV="dev"
  KOAJS_PORT="4000"
fi

export DOCKER_ENV
export KOAJS_PORT

# Can optionally provide a specific service to start. Defaults to all
docker compose -p web-api-$DOCKER_ENV up -d ${SERVICE:+ $SERVICE}
