#!/bin/bash
yarn 
pushd $1 
yarn  
../node_modules/.bin/node-dev --poll --respawn -r source-map-support/register test/test.js