const gate = (fn) => (opts) => {
  // NOTE - `preparingResponse` is a non-standard prop I add when prepping
  // async responses.
  const { headersSent, preparingResponse } = opts.res;
  if (!headersSent && !preparingResponse) fn(opts);
};

module.exports = [
  gate(require('./static')),
  gate(require('./api')),
  gate(require('./view')),
];