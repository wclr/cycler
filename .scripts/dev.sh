#!/bin/bash

BUILD_IMAGE_CMD="docker build -t cycler-dev-node ."

echo "What would you linke to do?"
echo "1) Start deps/build services (you need to do it first)"
echo "2) Start package develpment test services"
echo "3) Test package test once"
echo "4) Test all packages"
echo "5) Run publish process (build, tests and NPM publication)"
echo "6) Install all the dependencies"
echo "7) Rebuild dev container image (in case something wrong with it)"

read ACTION
SERVICES=

case $ACTION in
1)
  $BUILD_IMAGE_CMD
  docker-compose up deps-install tsc-build
  ;;
2)
  echo "Type names of packages you want to start tests for"
  read PACKAGES
  $BUILD_IMAGE_CMD
  docker-compose up $PACKAGES
  ;;
3) echo "Which package would you like to test?"
  read PACKAGE
  docker-compose run -T -e RUN_ONCE=true $PACKAGE
  ;;
4)
  echo "Not implemented"
  ;;
5)  
  $BUILD_IMAGE_CMD
  bash .scripts/publish-packages.sh
  ;;
6)
  $BUILD_IMAGE_CMD
  bash .scripts/install-deps.sh
  ;;
7)
  $BUILD_IMAGE_CMD
  docker build -t cycler-dev-node --no-cache .
  ;;
*)
  echo "Wat?"
  ;;
esac