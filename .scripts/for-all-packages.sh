#!/bin/bash

# This script is for executing command 
# for all package directories.
$exitstatus=0

while read d; do
  echo "> $d";
  echo "> $@";
  echo "";
  cd $d;
  #sh -c ls && ls
  sh -c "${@/\$d/$d}"
  #${@/\$d/$d} || exitstatus=$?;
  #bash -c ls || exitstatus=$?;
  cd ..;
  if [[ $exitstatus -ne 0 ]]; then
    break;
    exit $exitstatus;
  fi
done <$(dirname $0)/PACKAGES

exit $exitstatus