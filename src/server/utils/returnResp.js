const returnResp = ({ data, label, prefix = '', resp }) => {
  if (!resp) throw Error('Missing `resp`');
  else {
    if (prefix && label) console.log(`[${prefix.toUpperCase()}] ${label}`);
    resp.setHeader('Content-Type', 'application/json');
    resp.end(JSON.stringify(data || {}));
  }
};

module.exports = returnResp;
