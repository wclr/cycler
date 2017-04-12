##!/bin/bash
set -e

# https://github.com/yarnpkg/yarn/issues/1961#issuecomment-292955073

yarnLinker="/usr/lib/node_modules/yarn/lib/package-linker.js"

# replace concurrency
sed -i -e 's/})(), 4);/})(), 1);/g' $yarnLinker
echo "Yarn package linker fixed (for docker)"