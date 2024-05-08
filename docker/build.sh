#!/bin/bash

export NAMESPACE=$1
if [ "$#" -ne 1 ]; then
  NAMESPACE="dev"
fi

docker build -t beanstalk-api:$NAMESPACE -f ./Dockerfile ../
