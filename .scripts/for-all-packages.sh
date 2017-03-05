#!/bin/bash

# This script is for executing command 
# for all package directories.
exitstatus=0

while read d; do
  if [ ! -d $d ]; then
    continue
  fi
  echo "> $d";
  # obscrure github token
  echo "> ${BUILT_URL/https:\/\/*@github.com/http://SECRET@github.com}";
  echo "";
  cd $d;
  sh -c "${@/\$d/$d}" || exitstatus=$?;
  cd ..;
  if [[ $exitstatus -ne 0 ]]; then
    break;
    exit $exitstatus;
  fi
done <$(dirname $0)/PACKAGES

exit $exitstatus