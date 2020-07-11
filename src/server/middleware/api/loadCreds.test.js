const log = jest.fn();
const logger = jest.fn(() => log);
jest.mock('../../utils/logger', () => ({ logger }));
jest.mock('../../utils/parseReq');
const parseReq = require('../../utils/parseReq');
jest.mock('../../utils/returnErrorResp');
const returnErrorResp = require('../../utils/returnErrorResp');
jest.mock('./decrypt');
const decrypt = require('./decrypt');
jest.mock('./encrypt');
const encrypt = require('./encrypt');
jest.mock('./getUsersCredentialsPath');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
jest.mock('./loadUsersCredentials');
const loadUsersCredentials = require('./loadUsersCredentials');
jest.mock('./streamOutput');
const streamOutput = require('./streamOutput');

const loadCreds = require('./loadCreds');

describe('loadCreds', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const encryptedUsername = 'asdf9a87dsf98as7df';
  const usersCredsPath = `creds_${encryptedUsername}.json`;
  const req = {};
  const resp = {};
  const creds = [
    'sldfiua8usdfuas:ajsdoif7asodifuapsoidfau7sd8fuapsdifu',
    'klsdfjoiasdufojiawef:sjldkfuaop87euoriajweokfnlaiosd7urp98aweroaisd',
  ];
  const loadedCreds = [
    'fakjsdhflijahelkjasdhf:id87foiaudhfiasdfyas8dfhaiouesfyisahdfiuohsd',
    'niuiruhisdjfhsiyihu:798u4irahefoy8a34hriuawo3f8hasifoa8wyerhiaudfiu',
  ];
  const password = 'passX';
  const username = 'userX';
  let postData = { password, username };
  let errorCB;
  let onStart;
  let onProcessingComplete;
  let onEnd;
  
  beforeEach(() => {
    errorCB = jest.fn();
    returnErrorResp.mockReset();
    returnErrorResp.mockReturnValue(errorCB);
  });
  
  it('should set up the logger', () => {
    expect(logger).toHaveBeenCalledWith('api:loadCreds');
  });
  
  describe('request parsed', () => {
    beforeEach(() => {
      parseReq.mockReturnValue(Promise.resolve(postData));
      streamOutput.mockImplementation(({ onStart: oS, onProcessingComplete: oP, onEnd: oE }) => {
        onStart = oS;
        onProcessingComplete = oP;
        onEnd = oE;
      });
      encrypt.mockReturnValueOnce(Promise.resolve({ value: encryptedUsername }));
      getUsersCredentialsPath.mockReturnValue(usersCredsPath);
      loadUsersCredentials.mockReturnValue(Promise.resolve(loadedCreds));
    });
  
    it('should get the data required to load creds', async (done) => {
      parseReq.mockReturnValue(Promise.resolve(postData));
      await loadCreds({ appConfig, req, resp });
    
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, username);
        expect(getUsersCredentialsPath).toHaveBeenCalledWith(encryptedUsername);
        expect(loadUsersCredentials).toHaveBeenCalledWith(usersCredsPath);
        expect(streamOutput).toHaveBeenCalledWith({ onStart, onProcessingComplete, onEnd, resp });
    
        done();
      });
    });
    
    describe('onStart', () => {
      it('should create a queue of pending decryptions', async (done) => {
        const stream = [];
        const data = { fu: 'bar' };
        const decrypted = JSON.stringify(data);
        decrypt.mockReturnValue(Promise.resolve(decrypted));
    
        const pending = await onStart(stream);
    
        expect(log).toHaveBeenCalledWith('[LOAD] Started');
        expect(stream.length).toBe(creds.length + 1);
        expect(stream[0]).toEqual(JSON.stringify({ recordsCount: creds.length }));
    
        Promise.all(pending).then((resolvedPromises) => {
          expect(resolvedPromises.length).toBe(creds.length);
          expect(log).toHaveBeenCalledWith(`  [DECRYPTED] 0`);
          expect(stream[1]).toEqual(`\n${JSON.stringify({ processedCount: 1 })}`);
          expect(log).toHaveBeenCalledWith(`  [DECRYPTED] 1`);
          expect(stream[2]).toEqual(`\n${JSON.stringify({ processedCount: 2 })}`);
    
          done();
        });
      });
    
      it('should add error data', async (done) => {
        const stream = [];
        const err = new Error('decryption failed');
        decrypt.mockReturnValue(Promise.reject(err));
        parseReq.mockReturnValue(Promise.resolve(postData));
      
        await loadCreds({ appConfig, req, resp });
      
        process.nextTick(async () => {
          const pending = await onStart(stream);
      
          Promise.all(pending).then(() => {
            const { error } = JSON.parse(stream[1]);
            expect(log).toHaveBeenCalledWith(`[ERROR] ${error}`);
      
            done();
          });
        })
      });
    });
    
    describe('onProcessingComplete', () => {
      const data = { fu: 'bar' };
      let stream;
    
      beforeEach(() => {
        stream = [];
        const decrypted = JSON.stringify(data);
        decrypt.mockReturnValue(Promise.resolve(decrypted));
      });
    
      it('should return a list of parsed creds', (done) => {
        Promise.all(onStart(stream)).then(() => {
          onProcessingComplete(stream).then(() => {
            expect(JSON.parse(stream.pop())).toEqual({
              creds: [data, data],
            });
      
            done();
          });
        });
      });
    });
    
    describe('onEnd', () => {
      it('should log that the load has finished', () => {
        onEnd();
        expect(log).toHaveBeenCalledWith('[LOAD] Done');
      });
    });
  });
  
  describe('request parse failed', () => {
    it('should return an error response', async (done) => {
      const err = 'ruh-roh';
      parseReq.mockReturnValue(Promise.reject(err));
      await loadCreds({ appConfig, req, resp });
  
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Load Creds request parse failed', resp });
        expect(errorCB).toHaveBeenCalledWith(err);
  
        done();
      });
    });
  });
});
