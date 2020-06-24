module.exports = function viewMiddleware({ res }) {
  const { readFile } = require('fs');
  const { CLIENT_PATH } = require('../../constants');
  
  readFile(`${CLIENT_PATH}/index.html`, (err, file) => {
    if (err) console.error('[ERROR]', err);
    else res.end(file);
  });
}