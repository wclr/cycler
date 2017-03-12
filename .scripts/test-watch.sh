#!/bin/bash

if [ $1 ]; then
  PACKAGE_FOLDER=$1
  cd $PACKAGE_FOLDER
fi

if [ -f test/test.js ]; then
  echo "Starting test watch in $PACKAGE_FOLDER"
  node-dev --poll --respawn -r source-map-support/register test/test.js
fi


