#!/bin/node
import { exec, argv } from './util'

const args = process.argv.slice(2).join(' ')

exec(`docker-compose run -T --entrypoint "${args}" deps-install`)
