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

let httpModule;
let protocol = 'http';
let server;

if (process.env.NODE_EXTRA_CA_CERTS) {
  const { readFileSync } = require('fs');
  const cert = readFileSync(process.env.NODE_EXTRA_CA_CERTS, 'utf8');
  const key = readFileSync(process.env.NODE_EXTRA_CA_CERTS.replace('.crt', '.key'), 'utf8');
  
  httpModule = require('https');
  protocol = 'https';
  server = httpModule.createServer({ cert, key }, requestHandler);
}
else {
  httpModule = require('http');
  server = httpModule.createServer(requestHandler);
}

server.listen(SERVER_PORT, (err) => {
  if (err) console.error('[ERROR]', err);
  else console.log(`Server running at ${protocol}://localhost:${SERVER_PORT}`);
});
