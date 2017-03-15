#!/bin/bash

PACKAGE=$1

if [[ -z $PACKAGE ]]; then
  exit 1
fi

cd $PACKAGE

if [ -f test/test.js ]; then
  if [[ $RUN_ONCE ]]; then
    echo "Starting test for $PACKAGE_FOLDER"  
    node -r source-map-support/register test/test.js
  else  
    echo "Starting test watch in $PACKAGE_FOLDER"  
    node-dev --poll --respawn -r source-map-support/register test/test.js
  fi
fi
