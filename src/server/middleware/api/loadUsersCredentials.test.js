jest.mock('fs');
const { existsSync, readFile } = require('fs');

const loadUsersCredentials = require('./loadUsersCredentials');

describe('loadUsersCredentials', () => {
  const filePath = '/root/path/file.json';
  let readPath;
  let readEncoding;
  let readCB;
  
  beforeEach(() => {
    readFile.mockImplementation((p, e, cb) => {
      readPath = p;
      readEncoding = e;
      readCB = cb;
    });
  });
  
  describe('read file', () => {
    beforeEach(() => {
      existsSync.mockReturnValue(true);
    });
    
    it('should start reading file', () => {
      loadUsersCredentials(filePath).then(() => {
        expect(existsSync).toHaveBeenCalledWith(filePath);
        expect(readPath).toBe(filePath);
        expect(readEncoding).toBe('utf8');
      });
    });
    
    it('should return the parsed data', () => {
      const data = ['asd9f78as9df:jasd78f9as8d7f9as8d7f90as87df09a7sdf'];
      const json = JSON.stringify(data);
      
      loadUsersCredentials().then((_data) => {
        expect(_data).toEqual(data);
      });
      readCB(null, json);
    });
  });
  
  describe('no file to read', () => {
    beforeEach(() => {
      existsSync.mockReturnValue(false);
    });
    
    it('should return a default Array', () => {
      loadUsersCredentials().then((data) => {
        expect(data).toEqual([]);
      });
    });
  });
});
