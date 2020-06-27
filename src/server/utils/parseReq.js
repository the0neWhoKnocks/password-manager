const parseReq = (req) => new Promise((resolve, reject) => {
  if (/^(DELETE|POST)$/i.test(req.method)) {
    let body = '';

    req.on('data', (data) => {
      body += data;
    });

    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch(err) { reject(err); }
    });
  }
});

module.exports = parseReq;
