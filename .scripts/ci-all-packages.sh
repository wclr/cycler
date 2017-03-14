#!/bin/bash
set -e
# Install packages deps, build and run tests

# Make script it executable: on travis CI need to run it with bash (sh doesn't work), 
# on windows `bash script.sh` fails

# if $GH_TOKEN not set (untrusted build) just exit
if [ -z "$GH_TOKEN" ]; then
  #echo "No GH_TOKEN env variable, exiting."
  echo "No GH_TOKEN env variable, skiping built git push."
  exit 0
fi

yarn run install-deps
yarn run tsc-build

# "Publish" built packages to github.com/cycler-built/<package>

# Set git identity
if [ "$GH_TOKEN" ]; then
  git config --global user.email "alexosh@me.com"
  git config --global user.name "whitecolor"
fi

# Url where built packages are located
BUILT_URL=https://${GH_TOKEN}@github.com/cycler-built

GITIGNORE_CONTENT="node_modules\nyarn-error.log\n*.ts"
# Get SHA of current cycler commit
SHA=$(git rev-parse HEAD)
SHA_BRANCH=$(echo $SHA| cut -c1-7)

declare -A SKIP_TEST_PACKAGES
SKIP_TEST_PACKAGES["mongoose"]=1

while read PACKAGE; do
  if [ ! -d $PACKAGE ]; then
    continue
  fi
  echo "> $PACKAGE";
  # obscrure github token
  echo "> ${BUILT_URL/https:\/\/*@github.com/http://SECRET@github.com}";  
  
  if [[ ! ${SKIP_TEST_PACKAGES[$PACKAGE]} ]]; then 
    yarn run test-package $PACKAGE    
  fi
  cd $PACKAGE
  PACKAGE_VERSION=$(node -pe "require('./package.json').version")
  BRANCH_NAME=$PACKAGE_VERSION-$SHA_BRANCH  
  if [ "$GH_TOKEN" ]; then
    echo "Creating git repo with branch $BRANCH_NAME"
    rm -rf .git
    git init
    git remote add built $BUILT_URL/$PACKAGE > /dev/null
    echo -e $GITIGNORE_CONTENT > .gitignore
    git add .
    git commit -m "Orginal SHA: $SHA"
    git push -f -q built master
    git checkout -b $BRANCH_NAME
    git push -f -q built $BRANCH_NAME
    git checkout -b $PACKAGE_VERSION
    git push -f -q built $PACKAGE_VERSION
    rm -rf .git .gitignore
  fi
  cd ..
  
done <$(dirname $0)/PACKAGES
