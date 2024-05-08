#!/bin/bash

export NAMESPACE=$1
if [ "$#" -ne 1 ]; then
  NAMESPACE="dev"
fi

docker compose -p web-api-$NAMESPACE up -d
