const parseReq = (req) => new Promise((resolve) => {
  if (/^(DELETE|POST)$/i.test(req.method)) {
    let body = '';

    req.on('data', (data) => {
      body += data;
    });

    req.on('end', () => {
      resolve(JSON.parse(body));
    });
  }
});

module.exports = parseReq;
