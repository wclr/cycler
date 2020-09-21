'use strict'
const { readdirSync, statSync } = require('fs')

var packageScopes = readdirSync('.').filter(
  (name) => !/^\.|_/.test(name) && statSync(name).isDirectory()
)

var otherScopes = ['META', 'examples']

module.exports = {
  types: [
    { value: 'update', name: 'update:     Updates to package' },
    { value: 'feat', name: 'feat:     Add a new feature' },
    { value: 'fix', name: 'fix:      Submit a bug fix' },
    { value: 'docs', name: 'docs:     Documentation only changes' },
    { value: 'release', name: 'release:  Publish a new version of a package.' },
    {
      value: 'refactor',
      description:
        'refactor:  A code change that neither fixes a bug nor adds a feature',
    },
    {
      value: 'chore',
      name:
        'chore:    Any internal changes that do not affect the\n            ' +
        'the users of packages. Includes refactoring.',
    },
  ],

  scopes: packageScopes
    .concat(otherScopes)
    .sort()
    .map((name) => ({ name })),

  scopeOverrides: {
    chore: packageScopes.concat(otherScopes),
    feat: packageScopes,
    fix: packageScopes,
    release: packageScopes,
    test: packageScopes,
  },
  skipQuestions: [],
  allowCustomScopes: false,
  // allowBreakingChanges: ['feat', 'fix'],
}
