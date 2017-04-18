#!/bin/node
import { exec, argv } from './util'

const args = argv._.join(' ')
exec(`docker-compose run -T --entrypoint "${args}" deps-install`)
