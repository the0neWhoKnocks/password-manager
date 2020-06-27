module.exports = function staticMiddleware({
  res,
  urlPath,
}) {
  if (/^\/(css|js|imgs)\/.*/.test(urlPath)) {
    res.preparingAsyncResponse();
    
    const { readFile } = require('fs');
    const { CLIENT_PATH } = require('../../constants');
    
    const filePath = `${CLIENT_PATH}${urlPath}`;
    readFile(filePath, (err, file) => {
      if (err) {
        console.error('[ERROR]', err);
        res.statusCode = 500;
        res.statusMessage = err;
        res.end();
      }
      else {
        const etag = require('etag');
        const mime = require('mime-types');
        
        res.setHeader('Content-Type', mime.lookup(`${CLIENT_PATH}${urlPath}`));
        res.setHeader('ETag', etag(file));
        if (filePath.includes('/imgs')) {
          res.setHeader('Cache-Control', `max-age=${60 * 60 * 24 * 365}`);
        }
        
        res.end(file);
      }
    });
  }
}