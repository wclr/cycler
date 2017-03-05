#!/bin/bash

LOCKFILE=.install-deps.lock

if [ -f $LOCKFILE ]; then
  echo "Waiting for dependencies being installed..."
fi

while [ -f $LOCKFILE ]
do
  sleep 1
done