const readPackage = (pkg) => {
  if (!pkg.name) {
    pkg.devDependencies = {
      ...pkg.devDependencies,
      ...pkg.eslintDependencies,
    }
  }

  return pkg
}

// eslint-disable-next-line no-undef
module.exports = {
  hooks: {
    readPackage,
  },
}
