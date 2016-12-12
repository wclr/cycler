#!/bin/bash

# Install packages deps, build and run tests

BUILD_SOURCE_CMD="../node_modules/.bin/tsc --outDir ."
TEST_SOURCE_CMD="node -r source-map-support/register test/test.js"

# Make script it executable: on travis CI need to run it with bash (sh doesn't work), 
# on windows `bash script.sh` fails
chmod +x ./.scripts/for-all-packages.sh

./.scripts/for-all-packages.sh "yarn && $BUILD_SOURCE_CMD && $TEST_SOURCE_CMD"

# "Publish" built packages to github.com/cycler-built/<package>

# Set git identity
git config --global user.email "alexosh@me.com"
git config --global user.name "whitecolor"

# Url where built packages are located
BUILT_URL=https://${GH_TOKEN}@github.com/cycler-built

GITIGNORE_CONTENT="node_modules\nyarn-error.log"

# Get SHA of current cycler commit
SHA=$(git rev-parse HEAD)
SHA_BRANCH=$(echo $SHA| cut -c1-7)

# Create temorary git repo inside the package 
# and replace cycler-built/<package> repo with new source
./.scripts/for-all-packages.sh " \
  rm -rf .git &&\
  git init &&\  
  git remote add built $BUILT_URL/\$d > /dev/null &&\
  echo '$GITIGNORE_CONTENT' > .gitignore &&\
  git add . &&\
  git commit -m \"Orginal SHA: $SHA\" &&\
  git push -f -q built master &&\
  git checkout -b $SHA_BRANCH
  git push -f -q built $SHA_BRANCH &&\
  rm -rf .git .gitignore
  "\
  /
