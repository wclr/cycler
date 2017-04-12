# @cycler

[![Build Status](https://travis-ci.org/whitecolor/cycler.svg?branch=master)](https://travis-ci.org/whitecolor/cycler)

Packages for [cycle.js](http://cycle.js.org) apps writtern in Typescript. [rxjs](https://github.com/ReactiveX/rxjs)/[most](https://github.com/cujojs/most) support.

**All the packages are in beta currenlty.**

## Packages

Below you will find a summary of each package and publication state.

| Package | Type | Description | Version |
|--------|-------|------------|----------|
| [`task`](./task) | Driver | Higher order factory for creating async request/response drivers. | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/task.svg?maxAge=86400) |
| `hmr` | Utility | :fire: Hot module replacment. | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/http.svg?maxAge=86400) |
| `http` | Driver | HTTP driver based on `@cycler/task` and `superagent`. | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/http.svg?maxAge=86400) |
| `mongoose` | Driver <small>(node)</small> | Mongodb driver based on `@cycler/task` and `mongoose`. | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/mongoose.svg?maxAge=86400) |
| `forage` | Driver <small>(browser)</small> |Driver for working with browser storages based on @cycler/task and [Mozilla's localForage](https://github.com/localForage/localForage). | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/forage.svg?maxAge=86400) |
| `express` | Driver <small>(node)</small> | Driver for handling [express.js](https://github.com/expressjs/express) requests. | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/forage.svg?maxAge=86400) |

## Development

Development workflow is base on docker-compose services, so you need to have `docker` and `docker-compose` installed, also you need `yarn` package manager installed.

`$ yarn dev` and follow the gray rabbit :rabbit:.


## NPM Publication

Npm publication is done automatically on each commit after tests have passed.
Script checks if current `version` of a package is already presents in the NPM registry, if it is not it tries to publish it.

`NPM_TOKEN` is set in Travis-CI equal to `_authToken` from `~/.npmrc`

## Licence

Fair play.