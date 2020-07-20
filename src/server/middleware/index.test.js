jest.mock('./inspect');
jest.mock('./logger');
jest.mock('./static');
jest.mock('./api');
jest.mock('./view');
const middleware = require('./index');

describe('middleware', () => {
  it('should run middleware in this order', () => {
    [
      'inspectMiddleware',
      'loggerMiddleware',
      'staticMiddleware',
      'apiMiddleware',
      'viewMiddleware',
    ].forEach((fnName, ndx) => {
      expect(middleware[ndx].name).toBe(fnName);
    });
  });
});
