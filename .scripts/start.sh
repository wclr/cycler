###!/bin/bash
set -e

PACKAGE=$1
ACTION=$2

case $ACTION in
  test-watch)      
    touch $PACKAGE/test/test.js
    node-dev --poll --respawn -r source-map-support/register $PACKAGE/test/test.js    
    ;;
  test)      
    touch $PACKAGE/test/test.js
    node -r source-map-support/register $PACKAGE/test/test.js    
    ;;
esac



ROOT=$PWD

cd $ROOT