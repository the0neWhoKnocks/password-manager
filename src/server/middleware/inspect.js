module.exports = function inspectMiddleware({
  resp,
  urlPath,
}) {
  if (process.env.NODE_ENV === 'dev') {
    // https://nodejs.org/api/inspector.html
    const inspector = require('inspector');
    const returnResp = require('../utils/returnResp');
    
    if (urlPath === '/json') {
      // open, close, url, Session
      inspector.open();
      resp.end();
    }
    else if (urlPath === '/json/version') {
      returnResp({
        data: {
          Browser: `node.js/${ process.version }`,
          'Protocol-Version': '1.1',
        },
        resp,
      });
    }
  }
}