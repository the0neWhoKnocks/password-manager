const gate = (fn) => (opts) => {
  // NOTE - `sendingAsyncResponse` is a non-standard prop I add when prepping
  // async responses. Express requires all middleware to call a `next()` method
  // if the response isn't returned in the current middleware.
  const { headersSent, sendingAsyncResponse } = opts.res;
  if (!headersSent && !sendingAsyncResponse) fn(opts);
};

module.exports = [
  gate(require('./static')),
  gate(require('./api')),
  gate(require('./view')),
];