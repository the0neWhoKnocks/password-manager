jest.mock('inspector');
const inspector = require('inspector');
jest.mock('../utils/returnResp');
const returnResp = require('../utils/returnResp');

const middleware = require('./inspect');

describe('inspect', () => {
  let resp;
  let urlPath;
  let _middleware;
  
  beforeEach(() => {
    inspector.open.mockReset();
    returnResp.mockReset();
    resp = { end: jest.fn() };
    urlPath = '';
  });
  
  describe('Non-Dev env', () => {
    it('should NOT do anything while NOT in dev', () => {
      process.env.NODE_ENV = 'production';
      _middleware = middleware();
      
      expect(inspector.open).not.toHaveBeenCalled();
      
      _middleware({ resp, urlPath });
      
      expect(resp.end).not.toHaveBeenCalled();
      expect(returnResp).not.toHaveBeenCalled();
    });
  });
  
  describe('Dev env', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'dev';
    });
    
    it('should initialize the inspector', () => {
      middleware();
      expect(inspector.open).toHaveBeenCalled();
    });
    
    describe('actual middleware', () => {
      beforeEach(() => {
        _middleware = middleware();
      });
      
      it('should initialize the inspector', () => {
        urlPath = '/json';
        _middleware({ resp, urlPath });
        
        expect(inspector.open).toHaveBeenCalled();
        expect(resp.end).toHaveBeenCalled();
      });
      
      it('should return the WS URL that the inspector is running on', () => {
        urlPath = '/json/list';
        const wsURL = 'ws//some/path';
        inspector.url.mockReturnValue(wsURL);
        _middleware({ resp, urlPath });
        
        expect(returnResp).toHaveBeenCalledWith({
          data: wsURL,
          resp,
        });
      });
      
      it('should provide the data the inspector needs', () => {
        urlPath = '/json/version';
        _middleware({ resp, urlPath });
        
        expect(returnResp).toHaveBeenCalledWith({
          data: {
            Browser: `node.js/${ process.version }`,
            'Protocol-Version': '1.1',
          },
          resp,
        });
      });
      
      it('should do nothing for non-accepted paths', () => {
        urlPath = '/some/other/path';
        _middleware({ resp, urlPath });
        
        expect(resp.end).not.toHaveBeenCalled();
        expect(returnResp).not.toHaveBeenCalled();
      });
    });
  });
});