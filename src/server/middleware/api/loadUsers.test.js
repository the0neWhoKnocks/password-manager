jest.mock('fs');
const { existsSync, readFile } = require('fs');

const { DATA_PATH } = require('../../../constants');
const loadUsers = require('./loadUsers');

describe('loadUsers', () => {
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
      loadUsers().then(() => {
        const path = `${DATA_PATH}/users.json`;
        expect(existsSync).toHaveBeenCalledWith(path);
        expect(readPath).toBe(path);
        expect(readEncoding).toBe('utf8');
      });
    });
    
    it('should handle a read error', () => {
      const err = 'ruh-roh';
      loadUsers().catch((err) => {
        expect(err).toBe(err);
      });
      readCB(err);
    });
    
    it('should return the parsed data', () => {
      const data = { 'asdfasdoiausdfioasdf': 'aosidhfoiae4reute87t9y48atrhfaiadkhjf' };
      const json = JSON.stringify(data);
      
      loadUsers().then((_data) => {
        expect(_data).toEqual(data);
      });
      readCB(null, json);
    });
  });
  
  describe('no file to read', () => {
    beforeEach(() => {
      existsSync.mockReturnValue(false);
    });
    
    it('should return a default Object', () => {
      loadUsers().then((data) => {
        expect(data).toEqual({});
      });
    });
  });
});
