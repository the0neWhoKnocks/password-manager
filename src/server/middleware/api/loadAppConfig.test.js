jest.mock('fs');
const { existsSync, readFile } = require('fs');
jest.mock('../../utils/returnErrorResp');
const returnErrorResp = require('../../utils/returnErrorResp');

const { CONFIG_PATH } = require('../../../constants');
const loadAppConfig = require('./loadAppConfig');

describe('loadAppConfig', () => {
  const resp = {};
  let errorCB;
  let readPath;
  let readEncoding;
  let readCB;
  
  beforeEach(() => {
    errorCB = jest.fn();
    returnErrorResp.mockReset();
    returnErrorResp.mockReturnValue(errorCB);
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
      loadAppConfig(resp).then(() => {
        expect(existsSync).toHaveBeenCalledWith(CONFIG_PATH);
        expect(readPath).toBe(CONFIG_PATH);
        expect(readEncoding).toBe('utf8');
      });
    });
    
    it('should handle a read error', () => {
      const err = 'ruh-roh';
      loadAppConfig(resp).catch((err) => {
        expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Config load failed', resp });
        expect(errorCB).toHaveBeenCalledWith(err);
      });
      readCB(err);
    });
    
    it('should return the parsed config', () => {
      const conf = { fu: 'bar', iv: 'dlfkjasoidfuoasidjfkasdjflskdfj' };
      const jsonConf = JSON.stringify(conf);
      const ivBuffer = [];
      global.Buffer = {
        from: jest.fn(() => ivBuffer),
      };
      
      loadAppConfig(resp).then((_conf) => {
        expect(Buffer.from).toHaveBeenCalledWith(conf.iv, 'hex');
        expect(_conf).toEqual({ ...conf, iv: ivBuffer });
      });
      readCB(null, jsonConf);
    });
  });
  
  describe('no file to read', () => {
    beforeEach(() => {
      existsSync.mockReturnValue(false);
    });
    
    it('should return nothing', () => {
      loadAppConfig(resp).then((conf) => {
        expect(conf).toBe(undefined);
      });
    });
  });
});
