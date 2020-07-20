const returnErrorResp = require('./returnErrorResp');

describe('returnErrorResp', () => {
  it('should throw error', () => {
    expect(() => returnErrorResp()()).toThrow('Missing `resp`');
  });
  
  describe('send error response', () => {
    let resp;
    
    beforeEach(() => {
      resp = {
        end: jest.fn(),
        setHeader: jest.fn(),
      };
    });
    
    it('should handle a String error', () => {
      const error = 'ruh-roh';
      returnErrorResp({ resp })(error);
      
      expect(resp.statusCode).toBe(500);
      expect(resp.statusMessage).toBe('Server Error');
      expect(resp.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(resp.end).toHaveBeenCalledWith(JSON.stringify({ error }));
    });
    
    it('should handle a thrown Error', () => {
      const label = 'With something';
      const error = new Error('ruh-roh');
      console.log = jest.fn();
      returnErrorResp({ label, resp })(error);
      
      expect(console.log).toHaveBeenCalledWith(`[ERROR] ${label}:`, error);
      expect(resp.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(resp.end).toHaveBeenCalledWith(JSON.stringify({ error: error.stack }));
    });
  });
});
