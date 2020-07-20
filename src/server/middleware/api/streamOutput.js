const streamOutput = ({
  onEnd,
  onProcessingComplete,
  onStart,
  resp,
}) => {
  const { Readable } = require('stream');
  const readData = new Readable({ read() {} });
  
  resp.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'X-Content-Type-Options': 'nosniff',
  });
  
  readData.pipe(resp);
  readData.on('end', () => {
    if (onEnd) onEnd();
    resp.end();
  });
  
  const pending = onStart(readData);
  
  Promise.all(pending).then(() => {
    onProcessingComplete(readData).then(() => {
      readData.push(null);
    });
  });
};

module.exports = streamOutput;
