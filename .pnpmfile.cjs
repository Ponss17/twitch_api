module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies['js-yaml']) {
        if (pkg.dependencies['js-yaml'].includes('3.')) {
          pkg.dependencies['js-yaml'] = '^3.15.1';
        }
      }
      if (pkg.devDependencies && pkg.devDependencies['js-yaml']) {
        if (pkg.devDependencies['js-yaml'].includes('3.')) {
          pkg.devDependencies['js-yaml'] = '^3.15.1';
        }
      }
      return pkg;
    }
  }
};
