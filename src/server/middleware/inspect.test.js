jest.mock('inspector');
const inspector = require('inspector');
jest.mock('../utils/returnResp');
const returnResp = require('../utils/returnResp');

const middleware = require('./inspect');

describe('inspect', () => {
  let resp;
  let urlPath;
  
  beforeEach(() => {
    inspector.open.mockReset();
    returnResp.mockReset();
    resp = { end: jest.fn() };
    urlPath = '';
  });
  
  describe('Non-Dev env', () => {
    it('should NOT do anything while NOT in dev', () => {
      process.env.NODE_ENV = 'production';
      middleware({ resp, urlPath });
      
      expect(inspector.open).not.toHaveBeenCalled();
      expect(returnResp).not.toHaveBeenCalled();
    });
  });
  
  describe('Dev env', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'dev';
    });
    
    it('should initialize the inspector', () => {
      urlPath = '/json';
      middleware({ resp, urlPath });
      
      expect(inspector.open).toHaveBeenCalled();
      expect(resp.end).toHaveBeenCalled();
    });
    
    it('should provide the data the inspector needs', () => {
      urlPath = '/json/version';
      middleware({ resp, urlPath });
      
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
      middleware({ resp, urlPath });
      
      expect(inspector.open).not.toHaveBeenCalled();
      expect(resp.end).not.toHaveBeenCalled();
    });
  });
});