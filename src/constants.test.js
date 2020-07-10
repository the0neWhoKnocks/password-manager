describe('constants', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  
  describe('DATA_PATH', () => {
    it('should use a custom path', () => {
      process.env.DATA_PATH = '/custom/path';
      const { DATA_PATH } = require('./constants');
      
      expect(DATA_PATH).toBe(process.env.DATA_PATH);
      
      delete process.env.DATA_PATH;
    });
    
    it('should use the default path', () => {
      const { DATA_PATH, ROOT_PATH } = require('./constants');
      
      expect(DATA_PATH).toBe(`${ROOT_PATH}/../data`);
    });
  });

  describe('SERVER_PORT', () => {
    it('should use a custom port', () => {
      process.env.SERVER_PORT = 5000;
      const { SERVER_PORT } = require('./constants');
      
      expect(SERVER_PORT).toBe(process.env.SERVER_PORT);
      
      delete process.env.SERVER_PORT;
    });
    
    it('should use the default port', () => {
      const { SERVER_PORT } = require('./constants');
      
      expect(SERVER_PORT).toBe(3000);
    });
  });
});