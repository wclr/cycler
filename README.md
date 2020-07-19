# @cycler

> Packages for [cycle.js](http://cycle.js.org) apps written with Typescript.

[![Build Status](https://travis-ci.org/whitecolor/cycler.svg?branch=master)](https://travis-ci.org/whitecolor/cycler)

## Packages

| Package          | Type    | Description                                                       | Version                                                                     |
| ---------------- | ------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`task`](./task) | Driver  | Higher order factory for creating async request/response drivers. | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/task.svg?maxAge=86400) |
| `hmr`            | Utility | :fire: Hot module replacment.                                     | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/http.svg?maxAge=86400) |
| `http`           | Driver  | HTTP driver based on `@cycler/task` and `superagent`.             | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/http.svg?maxAge=86400) |

| `forage` | Driver <small>(browser)</small> | Driver for working with browser storages based on @cycler/task and [Mozilla's localForage](https://github.com/localForage/localForage). | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/forage.svg?maxAge=86400) |
| `express` | Driver <small>(node)</small> | Driver for handling [express.js](https://github.com/expressjs/express) requests. | ![npm (scoped)](https://img.shields.io/npm/v/@cycler/forage.svg?maxAge=86400) |

## Development

- `yarn test` (`yarn docker-test`)
- `yarn wacth package` (`yarn docker-watch package`)

## Licence

WFT.
