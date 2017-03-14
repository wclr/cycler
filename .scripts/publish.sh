#!/bin/bash
set -e 

if [ $1 ]; then
  PACKAGE_FOLDER=$1
  cd $PACKAGE_FOLDER
fi


CURRENT_USER=$(npm whoami)
echo CURRENT_USER: $CURRENT_USER

if [ ! $CURRENT_USER == 'cycler' ] 
  echo "Login with @cycler account"
fi