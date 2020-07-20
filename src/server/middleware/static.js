module.exports = function staticMiddleware({
  req,
  resp,
  urlPath,
}) {
  if (/^\/(css|js|imgs)\/.+/.test(urlPath)) {
    resp.preparingAsyncResponse();
    
    const { readFile } = require('fs');
    const { CLIENT_PATH } = require('../../constants');
    
    const filePath = `${CLIENT_PATH}${urlPath}`;
    readFile(filePath, (err, file) => {
      if (err) {
        // Chrome likes to hold on to favicon's for localhost, so we're not
        // going to worry about them missing for now.
        if (!filePath.endsWith('favicon.ico')) console.error('[ERROR]', err);
        resp.statusCode = 500;
        resp.statusMessage = err;
        resp.end();
      }
      else {
        const etag = require('etag');
        const mime = require('mime-types');
        const tag = etag(file);
        
        resp.setHeader('Content-Type', mime.lookup(`${CLIENT_PATH}${urlPath}`));
        
        if (req.headers['if-none-match'] === tag) {
          resp.statusCode = 304;
          resp.end('');
        }
        else {
          resp.setHeader('ETag', tag);
          // `no-cache` is misleading. It doesn’t mean "do not cache". This
          // tells the Browser to cache the file but not to use it until it 
          // checks with the Server to validate we have the latest version. 
          // This validation is done with the ETag header.
          resp.setHeader('Cache-Control', `private, no-cache, max-age=${60 * 60 * 24 * 365}`);
          resp.end(file);
        }
      }
    });
  }
}