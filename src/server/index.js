const http = require('http');
const url = require('url');
const middleware = require('./middleware');
const { SERVER_PORT } = require('../constants');

const server = http.createServer((req, resp) => {
  const { pathname: urlPath } = url.parse(req.url);
  
  resp.preparingAsyncResponse = () => { resp.sendingAsyncResponse = true; };
  
  for (let i=0; i<middleware.length; i++) {
    middleware[i]({ req, resp, urlPath });
  }
});

server.listen(SERVER_PORT, (err) => {
  if (err) console.error('[ERROR]', err);
  else console.log(`Server running at http://localhost:${SERVER_PORT}`);
});