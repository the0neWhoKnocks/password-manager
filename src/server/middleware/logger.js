const debugModule = require('debug');
const { ROOT_NAMESPACE } = require('../utils/logger');

debugModule.inspectOpts.hideDate = true;

function loggerMiddleware({ req }) {
  // URL is `/` or `/?<param>`
  if (/^\/(\?.*)?$/.test(req.url)) {
    const reqUrl = new URL(req.url, `${req.protocol}://${req.headers.host}`);
    const { debug } = reqUrl.searchParams;
    
    if (debug) {
      loggerMiddleware.loggerEnabled = true;
      debugModule.enable(`${ROOT_NAMESPACE}:${debug}`);
      console.log('[LOGGER] Enabled from middleware');
    }
    else if (loggerMiddleware.loggerEnabled) {
      loggerMiddleware.loggerEnabled = false;
      debugModule.disable();
      console.log('[LOGGER] Disabled from middleware');
    }
  }
}
loggerMiddleware.loggerEnabled = false;

module.exports = loggerMiddleware;
