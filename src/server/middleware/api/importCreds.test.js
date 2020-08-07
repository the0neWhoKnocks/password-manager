jest.mock('fs');
const { writeFile } = require('fs');
const log = jest.fn();
const logger = jest.fn(() => log);
jest.mock('../../utils/logger', () => ({ logger }));
jest.mock('../../utils/parseReq');
const parseReq = require('../../utils/parseReq');
jest.mock('../../utils/returnErrorResp');
const returnErrorResp = require('../../utils/returnErrorResp');
jest.mock('../../utils/returnResp');
const returnResp = require('../../utils/returnResp');
jest.mock('./decrypt');
const decrypt = require('./decrypt');
jest.mock('./encrypt');
const encrypt = require('./encrypt');
jest.mock('./getUsersCredentialsPath');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
jest.mock('./loadUsersCredentials');
const loadUsersCredentials = require('./loadUsersCredentials');

const importCreds = require('./importCreds');

describe('importCreds', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const encryptedUsername = 'asdf9a87dsf98as7df';
  const usersCredsPath = `creds_${encryptedUsername}.json`;
  const loadedEncryptedData = 'rweiyrwiueyrwe:mnmbhdkfiuyoiuwehfiajsdfjasdbfliahsiduf';
  const newEncryptedData = 'sdfuoiuasodf:falksdjfoieruyoaisdflkasdflkasuroiaehrpoaidflaskdhf';
  const req = {};
  const resp = {};
  const creds = [
    { cred: 3 },
    { cred: 4 },
  ];
  const decryptedCreds = [
    { cred: 1 },
    { cred: 2 },
  ];
  const password = 'passX';
  const username = 'userX';
  const user = { password, username };
  let postData = { creds, user };
  let errorCB;
  let writePath;
  let writeData;
  let writeEncoding;
  let writeCB;
  
  beforeEach(() => {
    errorCB = jest.fn();
    returnErrorResp.mockReset();
    returnErrorResp.mockReturnValue(errorCB);
    writeFile.mockImplementation((p, d, e, cb) => {
      writePath = p;
      writeData = d;
      writeEncoding = e;
      writeCB = cb;
    });
  });
  
  it('should set up the logger', () => {
    expect(logger).toHaveBeenCalledWith('api:importCreds');
  });
  
  describe('request parsed', () => {
    beforeEach(() => {
      parseReq.mockReturnValue(Promise.resolve(postData));
      encrypt
        .mockReturnValueOnce(Promise.resolve({ value: encryptedUsername }))
        .mockReturnValueOnce(Promise.resolve({ combined: newEncryptedData }));
      decrypt.mockReturnValueOnce(Promise.resolve(decryptedCreds));
      getUsersCredentialsPath.mockReturnValue(usersCredsPath);
      loadUsersCredentials.mockReturnValue(Promise.resolve(loadedEncryptedData));
    });
    
    it('should get the data required to import creds', async (done) => {
      parseReq.mockReturnValue(Promise.resolve(postData));
      await importCreds({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, username);
        expect(getUsersCredentialsPath).toHaveBeenCalledWith(encryptedUsername);
        expect(loadUsersCredentials).toHaveBeenCalledWith(usersCredsPath);
        
        done();
      });
    });
    
    it('should combine credentials', async (done) => {
      parseReq.mockReturnValue(Promise.resolve(postData));
      await importCreds({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, [...decryptedCreds, ...postData.creds], password);
        
        done();
      });
    });
    
    it('should account for the first import', async (done) => {
      parseReq.mockReturnValue(Promise.resolve(postData));
      loadUsersCredentials.mockReturnValue([]);
      await importCreds({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, [...postData.creds], password);
        
        done();
      });
    });
    
    describe('writeFile', () => {
      it('should account for the first import', async (done) => {
        parseReq.mockReturnValue(Promise.resolve(postData));
        await importCreds({ appConfig, req, resp });
        
        process.nextTick(() => {
          expect(writePath).toBe(usersCredsPath);
          expect(JSON.parse(writeData)).toBe(newEncryptedData);
          expect(writeEncoding).toBe('utf8');
          
          done();
        });
      });
      
      it('should handle write error', async (done) => {
        parseReq.mockReturnValue(Promise.resolve(postData));
        await importCreds({ appConfig, req, resp });
        
        process.nextTick(() => {
          const err = new Error('ruh-roh');
          const errMsg = `Import Creds write failed | ${err.stack}`;
          writeCB(err);
          
          expect(log).toHaveBeenCalledWith(`[ERROR] ${errMsg}`);
          expect(returnResp).toHaveBeenCalledWith({ data: { error: errMsg }, resp });
          
          done();
        });
      });
      
      it('should handle write success', async (done) => {
        parseReq.mockReturnValue(Promise.resolve(postData));
        await importCreds({ appConfig, req, resp });
        
        process.nextTick(() => {
          log.mockReset();
          writeCB();
          
          expect(log).not.toHaveBeenCalled();
          expect(returnResp).toHaveBeenCalledWith({ data: {}, resp });
          
          done();
        });
      });
    });
  });
  
  describe('request parse failed', () => {
    it('should return an error response', async (done) => {
      const err = 'ruh-roh';
      parseReq.mockReturnValue(Promise.reject(err));
      await importCreds({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Import Creds request parse failed', resp });
        expect(errorCB).toHaveBeenCalledWith(err);
        
        done();
      });
    });
  });
});
