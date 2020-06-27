module.exports = function staticMiddleware({
  resp,
  urlPath,
}) {
  if (/^\/(css|js|imgs)\/.*/.test(urlPath)) {
    resp.preparingAsyncResponse();
    
    const { readFile } = require('fs');
    const { CLIENT_PATH } = require('../../constants');
    
    const filePath = `${CLIENT_PATH}${urlPath}`;
    readFile(filePath, (err, file) => {
      if (err) {
        console.error('[ERROR]', err);
        resp.statusCode = 500;
        resp.statusMessage = err;
        resp.end();
      }
      else {
        const etag = require('etag');
        const mime = require('mime-types');
        
        resp.setHeader('Content-Type', mime.lookup(`${CLIENT_PATH}${urlPath}`));
        resp.setHeader('ETag', etag(file));
        if (filePath.includes('/imgs')) {
          resp.setHeader('Cache-Control', `max-age=${60 * 60 * 24 * 365}`);
        }
        
        resp.end(file);
      }
    });
  }
}