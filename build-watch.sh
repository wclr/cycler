#!/bin/bash
yarn 
pushd $1 
yarn  
node ../make-tsconfig
../node_modules/.bin/tsc --outDir . -w