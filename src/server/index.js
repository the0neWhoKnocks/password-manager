const http = require('http');
const url = require('url');
const middleware = require('./middleware');
const { SERVER_PORT } = require('../constants');

const server = http.createServer((req, res) => {
  const { pathname: urlPath } = url.parse(req.url);
  
  for (let i=0; i<middleware.length; i++) {
    middleware[i]({ res, urlPath });
  }
});

server.listen(SERVER_PORT, (err) => {
  if (err) console.error('[ERROR]', err);
  else console.log(`Server running at http://localhost:${SERVER_PORT}`);
});