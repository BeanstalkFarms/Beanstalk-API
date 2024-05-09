#!/bin/bash

DOCKER_ENV=$1
if [ "$#" -ne 1 ]; then
  DOCKER_ENV="dev"
fi

export DOCKER_ENV

docker compose -p web-api-$DOCKER_ENV stop
