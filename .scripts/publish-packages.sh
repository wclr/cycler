#!/bin/bash
set -e
# Installs dependencies, builds, runs tests and publishes to NPM

# Make script it executable: on travis CI need to run it with bash (sh doesn't work), 
# on windows `bash script.sh` fails

yarn run build-dev-image
# run once install end build
docker-compose run --entrypoint "bash .scripts/install-deps.sh" deps-install

echo "Removing all previously built files..."
rm -rf  *.js.map *.d.ts *.js **/*.js.map **/*.d.ts **/*.js

docker-compose run -T --entrypoint "yarn run tsc-build" tsc-build

declare -A SKIP_TEST_PACKAGES
#SKIP_TEST_PACKAGES["mongoose"]=1
#SKIP_TEST_PACKAGES["task"]=1

while read PACKAGE; do
  if [ ! -d $PACKAGE ]; then
    continue
  fi
  echo "> $PACKAGE";
  
  if [[ ! ${SKIP_TEST_PACKAGES[$PACKAGE]} ]]; then 
    yarn run docker-test-package $PACKAGE
    #docker-compose run -T -e RUN_ONCE=true $PACKAGE
  fi

  # if [[ -z $NPM_TOKEN ]]; then
  #   echo "No NPM_TOKEN env variable, skiping publication."
  #   continue
  # fi

  cd $PACKAGE
    
  PACKAGE_VERSION=$(node -pe "require('./package.json').version")
  
  # Turn off errors to bypass `Not Found` error
  set +e    
  VERSIONS=$(npm show @cycler/$PACKAGE versions)
  set -e

  if [[ ! $VERSIONS == *\'$PACKAGE_VERSION\'* ]]; then
    # copy .npmignore from root
    #if [[ ! -f .npmignore ]]; then
      cp ../.npmignore .
    #fi
    echo "Publishing $PACKAGE@$PACKAGE_VERSION"
    #npm publish --access=public
  else
    echo "Version $PACKAGE@$PACKAGE_VERSION already published."
  fi
  
  cd ..

done < $(dirname $0)/RELEASABLE_PACKAGES
