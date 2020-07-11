const http = require('http');
const url = require('url');
const middleware = require('./middleware');
const { SERVER_PORT } = require('../constants');

const _middleware = middleware.map((fn) => (opts) => {
  // NOTE - `sendingAsyncResponse` is a non-standard prop I add when
  // prepping async responses. Express requires all middleware to call a 
  // `next()` method if the response isn't returned in the current
  // middleware.
  const { headersSent, sendingAsyncResponse } = opts.resp;
  if (!headersSent && !sendingAsyncResponse) fn(opts);
});

const requestHandler = (req, resp) => {
  const { pathname: urlPath } = url.parse(req.url);
  
  resp.preparingAsyncResponse = () => { resp.sendingAsyncResponse = true; };
  
  for (let i=0; i<_middleware.length; i++) {
    _middleware[i]({ req, resp, urlPath });
  }
};

const server = http.createServer(requestHandler);

server.listen(SERVER_PORT, (err) => {
  if (err) console.error('[ERROR]', err);
  else console.log(`Server running at http://localhost:${SERVER_PORT}`);
});