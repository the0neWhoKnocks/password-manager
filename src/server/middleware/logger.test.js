jest.mock('debug');
const debugModule = require('debug');

const url = require('url');
const middleware = require('./logger');

describe('logger', () => {
  let req;
  
  beforeEach(() => {
    req = {};
    debugModule.enable.mockReset();
    debugModule.disable.mockReset();
  });
  
  describe('skip middleware', () => {
    it('should NOT do anything', () => {
      const parseSpy = jest.spyOn(url, 'parse');
      req.url = '/path?debug=*';
      middleware({ req });
      
      expect(parseSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('run middleware', () => {
    beforeEach(() => {
      console.log = jest.fn();
    });
    
    it('should enable the logger', () => {
      req.url = '/?debug=*';
      middleware({ req });
      
      expect(debugModule.enable).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('[LOGGER] Enabled from middleware');
    });
    
    it('should disable the logger', () => {
      middleware.loggerEnabled = true;
      req.url = '/';
      middleware({ req });
      
      expect(debugModule.disable).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('[LOGGER] Disabled from middleware');
    });
    
    it('should try to disable the logger ONLY if it is currently enabled', () => {
      middleware.loggerEnabled = false;
      req.url = '/';
      middleware({ req });
      
      expect(debugModule.disable).not.toHaveBeenCalled();
    });
  });
});
