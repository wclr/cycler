#!/bin/bash

# This script is for executing command 
# for all package directories.

FILES=./*

for d in $FILES 
do  
  if [ -f $d/package.json ];
  then
    pushd $d > /dev/null    
    echo "Executing in $d"
    $1 $2 $3 $4 $5
    popd > /dev/null      
  fi  
done
