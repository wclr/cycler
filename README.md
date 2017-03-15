# cycler

[![Build Status](https://travis-ci.org/whitecolor/cycler.svg?branch=master)](https://travis-ci.org/whitecolor/cycler)

**All the packages are in beta currenlty.**


## Development

You need Docker and Docker Compose installed. Start containers with common dev tasks: for installing deps and building typescript:

`$ yarn dev-deps` 

Start test-watch for needed packages:

`$ yarn dev task http ... `

To stop all the services:

`docker-compose stop`

## NPM publication

Npm publication is done automatically on each commit after tests have passed.
Script checks if current `version` of a package is already presents in the NPM registry, if it is not it tries to publish it.

`NPM_TOKEN` is set in Travis-CI equal to `_authToken` from `~/.npmrc`