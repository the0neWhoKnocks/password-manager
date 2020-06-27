const returnErrorResp = ({ label, resp }) => (err) => {
  if (!resp) throw Error('Missing `resp`');
  else {
    let errMsg = err;
    resp.statusCode = 500;
    resp.statusMessage = 'Server Error';
    
    if (err instanceof Error) {
      console.log(`[ERROR] ${label}:`, err);
      errMsg = err.stack;
    }
    
    resp.setHeader('Content-Type', 'application/json');
    resp.end(JSON.stringify({ error: `${errMsg}` }));
  }
};

module.exports = returnErrorResp;
