#!/bin/bash
set -e 

PACKAGE_FOLDER=$1

if [[ -z $PACKAGE_FOLDER ]]; then
  exit 1
fi

cd $PACKAGE_FOLDER

NODE_CMD="node"

if [ -f test/test.js ]; then
  echo "Starting test in $PACKAGE_FOLDER"
  $NODE_CMD -r source-map-support/register test/test.js
fi
