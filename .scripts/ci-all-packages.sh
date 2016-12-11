#!/bin/bash

# This script is for executing command 
# for all package directories.
BUILD_SOURCE_CMD=../node_modules/.bin/tsc --outDir .
TEST_SOURCE_CMD=node -r source-map-support/register test/test.js
sh ./.scripts/for-all-packages.sh yarn && $BUILD_SOURCE_CMD && $TEST_SOURCE_CMD

SHA=$(git rev-parse HEAD)

# url where built packages are located
BUILT_URL=https://github.com/cycler-built

sh ./.scripts/for-all-packages.sh " \
  rm -rf .git &&\
  git init &&\
  git remote add built $BUILT_URL/\$d &&\
  git remote show built &&\
  echo -e node_modules'\\n'yarn-error.log > .gitignore &&\
  git add . &&\
  git commit -m \"Orginal SHA: $SHA\" &&\
  git push -f built master &&\
  rm -rf .git .gitignore
  "\
  /