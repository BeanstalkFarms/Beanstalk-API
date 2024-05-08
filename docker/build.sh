#!/bin/bash

DOCKER_ENV=$1
KOAJS_PORT=$2
if [ "$#" -ne 2 ]; then
  DOCKER_ENV="dev"
  KOAJS_PORT="3000"
fi

export DOCKER_ENV
export KOAJS_PORT

docker build -t beanstalk-api:$DOCKER_ENV -f ./Dockerfile ../
