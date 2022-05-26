// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const { rename } = require('fs');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('after:screenshot', ({ path }) => {
    // NOTE - Cypress doesn't overwrite files, so check if it appended a number
    // to a new screenshot, and handle it manually.
    const numberSuffixRegEx = /\s\(\d\)\.png$/;
    if (numberSuffixRegEx.test(path)) {
      const newPath = path.replace(numberSuffixRegEx, '.png');

      return new Promise((resolve, reject) => {
        rename(path, newPath, (err) => {
          if (err) return reject(err);
          resolve({ path: newPath });
        });
      });
    }
    else return Promise.resolve();
  });
  
  on('task', {
    require(path, clearCache) {
      if (clearCache) delete require.cache[require.resolve(path)];
      return require(path);
    },
  });
  
  return {
    // NOTE - In headless mode, the `electron` Browser always has to be present
    // or the tests won't run.
    // I move Electron to the top of the Browsers list since it seems to be
    // the most reliable on all OS's (as far as display).
    browsers: config.browsers.sort(({ name }) => name === 'electron' ? -1 : 0),
  };
};
