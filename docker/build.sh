#!/bin/bash

DOCKER_ENV=$1
if [ "$#" -ne 1 ]; then
  DOCKER_ENV="dev"
fi

export DOCKER_ENV

docker build -t beanstalk-api:$DOCKER_ENV -f ./Dockerfile ../
