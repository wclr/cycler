#!/bin/bash

CMD=".scripts/install-deps.sh"

$CMD --linklocal

chokidar '**/yarn.lock' -i '**/node_modules' --polling \
  -c "$CMD {path} --linklocal"
