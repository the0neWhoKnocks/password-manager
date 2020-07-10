const url = require('url');
const debugModule = require('debug');
const { ROOT_NAMESPACE } = require('../utils/logger');

let loggerEnabled = false;

debugModule.inspectOpts.hideDate = true;

module.exports = function loggerMiddleware({ req }) {
  // URL is `/` or `/?<param>`
  if (/^\/(\?.*)?$/.test(req.url)) {
    const { debug } = url.parse(req.url, true).query || {};
    
    if (debug) {
      loggerEnabled = true;
      debugModule.enable(`${ROOT_NAMESPACE}:${debug}`);
      console.log('[LOGGER] Enabled from middleware');
    }
    else if (loggerEnabled) {
      loggerEnabled = false;
      debugModule.disable();
      console.log('[LOGGER] Disabled from middleware');
    }
  }
}