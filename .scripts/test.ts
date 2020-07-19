#!/bin/node
import {
  packages, testPackage,
  installDeps,
  firstArg as packageName,
  exec,
} from './util'


const packagesToTest = packageName ? [packageName] : packages 

// installDeps(packagesToTest)
packagesToTest.forEach(testPackage)
