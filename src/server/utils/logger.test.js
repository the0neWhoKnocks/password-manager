jest.mock('debug');
const debug = require('debug');

const extendedLogger = jest.fn();
const extend = jest.fn(() => extendedLogger);
const rootLogger = jest.fn();
rootLogger.extend = extend;
debug.mockReturnValue(rootLogger);

const {
  ROOT_NAMESPACE,
  logger,
} = require('./logger');

describe('logger', () => {
  it('should set up the root logger', () => {
    expect(debug).toHaveBeenCalledWith(ROOT_NAMESPACE);
  });
  
  it('should return the root logger if a namespace was NOT passed', () => {
    expect(logger()).toBe(rootLogger);
  });
  
  it('should return a logger extended from the root logger', () => {
    const ns = 'custom:logger';
    expect(logger(ns)).toBe(extendedLogger);
    expect(extend).toHaveBeenCalledWith(ns);
  });
});
