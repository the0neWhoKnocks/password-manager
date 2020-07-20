const readableAPI = {
  on: jest.fn(),
  pipe: jest.fn(),
  push: jest.fn(),
};
function mockReadable() { return readableAPI; }
jest.mock('stream', () => ({
  Readable: jest.fn(mockReadable),
}));
const { Readable } = require('stream');

const streamOutput = require('./streamOutput');

describe('streamOutput', () => {
  let onEnd;
  let onProcessingComplete;
  let onStart;
  let resp;
  let readEv;
  let readCB;
  
  beforeAll(() => {
    onStart = jest.fn(() => [
      Promise.resolve(),
      Promise.resolve(),
    ]);
    onProcessingComplete = jest.fn(() => Promise.resolve());
    onEnd = jest.fn();
    resp = {
      end: jest.fn(),
      writeHead: jest.fn(),
    };
    readableAPI.on.mockImplementation((ev, cb) => {
      readEv = ev;
      readCB = cb;
    });
  });
  
  it('should start streaming the response', (done) => {
    streamOutput({ onEnd, onProcessingComplete, onStart, resp });
    
    process.nextTick(() => {
      expect(() => { Readable.mock.calls[0][0].read() }).not.toThrow();
      expect(resp.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      });
      expect(readableAPI.pipe).toHaveBeenCalledWith(resp);
      expect(readEv).toBe('end');
      expect(onStart).toHaveBeenCalledWith(readableAPI);
      
      done();
    });
  });
  
  it('should trigger pre-end handlers', (done) => {
    streamOutput({ onEnd, onProcessingComplete, onStart, resp });
    
    process.nextTick(() => {
      expect(onProcessingComplete).toHaveBeenCalledWith(readableAPI);
      expect(readableAPI.push).toHaveBeenCalledWith(null);
      
      done();
    });
  });
  
  it('should close the response', (done) => {
    streamOutput({ onProcessingComplete, onStart, resp });
    
    process.nextTick(() => {
      readCB();
      expect(resp.end).toHaveBeenCalled();
      
      done();
    });
  });
  
  it('should trigger end handler if one exists', (done) => {
    streamOutput({ onEnd, onProcessingComplete, onStart, resp });
    
    process.nextTick(() => {
      readCB();
      expect(onEnd).toHaveBeenCalled();
      
      done();
    });
  });
});
