#!/bin/bash

cd $(dirname "$0")

DOCKER_ENV=$1
SERVICE=$2
if [ -z "$DOCKER_ENV" ]; then
  DOCKER_ENV="dev"
fi

export DOCKER_ENV

docker compose -p web-api-$DOCKER_ENV stop ${SERVICE:+ $SERVICE}
