const returnResp = require('./returnResp');

describe('returnResp', () => {
  it('should throw error', () => {
    expect(() => returnResp()()).toThrow('Missing `resp`');
  });
  
  describe('send error response', () => {
    let resp;
  
    beforeEach(() => {
      resp = {
        end: jest.fn(),
        setHeader: jest.fn(),
      };
    });
    
    it('should send default JSON data', () => {
      returnResp({ resp });
      
      expect(resp.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(resp.end).toHaveBeenCalledWith('{}');
    });
    
    it('should send specified JSON data', () => {
      const data = { fu: 'bar' };
      returnResp({ data, resp });
      
      expect(resp.end).toHaveBeenCalledWith(JSON.stringify(data));
    });
    
    it('should send specified JSON data', () => {
      const prefix = 'loaded';
      const label = 'Data';
      console.log = jest.fn();
      returnResp({ label, prefix, resp });
      
      expect(console.log).toHaveBeenCalledWith(`[${prefix.toUpperCase()}] ${label}`);
    });
  });
});
