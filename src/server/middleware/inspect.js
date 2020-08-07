module.exports = () => {
  // https://nodejs.org/api/inspector.html
  let inspector;
  
  if (process.env.NODE_ENV === 'dev') {
    inspector = require('inspector');
    inspector.open();
  }
  
  return function inspectMiddleware({
    resp,
    urlPath,
  }) {
    if (process.env.NODE_ENV === 'dev') {
      const returnResp = require('../utils/returnResp');
      
      if (urlPath === '/json') {
        resp.end();
      }
      else if (urlPath === '/json/list') {
        returnResp({
          data: inspector.url(),
          resp,
        });
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
}