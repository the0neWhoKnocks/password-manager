jest.mock('fs');
const { writeFile } = require('fs');
const log = jest.fn();
const logger = jest.fn(() => log);
jest.mock('../../utils/logger', () => ({ logger }));
jest.mock('../../utils/parseReq');
const parseReq = require('../../utils/parseReq');
jest.mock('../../utils/returnErrorResp');
const returnErrorResp = require('../../utils/returnErrorResp');
jest.mock('./encrypt');
const encrypt = require('./encrypt');
jest.mock('./getUsersCredentialsPath');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
jest.mock('./loadUsersCredentials');
const loadUsersCredentials = require('./loadUsersCredentials');
jest.mock('./streamOutput');
const streamOutput = require('./streamOutput');

const importCreds = require('./importCreds');

describe('importCreds', () => {
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
  const user = { password, username };
  let postData = { creds, user };
  let errorCB;
  let onStart;
  let onProcessingComplete;
  let onEnd;
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
      streamOutput.mockImplementation(({ onStart: oS, onProcessingComplete: oP, onEnd: oE }) => {
        onStart = oS;
        onProcessingComplete = oP;
        onEnd = oE;
      });
      encrypt.mockReturnValueOnce(Promise.resolve({ value: encryptedUsername }));
      getUsersCredentialsPath.mockReturnValue(usersCredsPath);
      loadUsersCredentials.mockReturnValue(Promise.resolve(loadedCreds));
    });
    
    it('should get the data required to import creds', async (done) => {
      parseReq.mockReturnValue(Promise.resolve(postData));
      await importCreds({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, username);
        expect(getUsersCredentialsPath).toHaveBeenCalledWith(encryptedUsername);
        expect(loadUsersCredentials).toHaveBeenCalledWith(usersCredsPath);
        expect(streamOutput).toHaveBeenCalledWith({ onStart, onProcessingComplete, onEnd, resp });
        
        done();
      });
    });
    
    describe('onStart', () => {
      it('should create a queue of pending encryptions', async (done) => {
        const stream = [];
        encrypt.mockReturnValue(Promise.resolve({ combined: 'sdfasdf:asdfadfasdf' }));
        
        const pending = await onStart(stream);
        
        expect(log).toHaveBeenCalledWith('[IMPORT] Started');
        expect(stream.length).toBe(creds.length + 1);
        expect(stream[0]).toEqual(JSON.stringify({ recordsCount: creds.length }));
        
        Promise.all(pending).then((resolvedPromises) => {
          expect(resolvedPromises.length).toBe(creds.length);
          expect(log).toHaveBeenCalledWith(`  [ENCRYPTED] 0`);
          expect(stream[1]).toEqual(`\n${JSON.stringify({ processedCount: 1 })}`);
          expect(log).toHaveBeenCalledWith(`  [ENCRYPTED] 1`);
          expect(stream[2]).toEqual(`\n${JSON.stringify({ processedCount: 2 })}`);
          
          done();
        });
      });
      
      it('should add error data', async (done) => {
        const stream = [];
        const err = new Error('encryption failed');
        encrypt.mockImplementation((...args) => {
          return (args[1] === creds[0] || args[1] === creds[1])
            ? Promise.reject(err)
            : Promise.resolve({ value: encryptedUsername });
        });
        parseReq.mockReturnValue(Promise.resolve(postData));
        
        await importCreds({ appConfig, req, resp });
        
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
      let stream;
      
      beforeEach(() => {
        stream = [];
        encrypt.mockReturnValue(Promise.resolve({ combined: 'sdfasdf:asdfadfasdf' }));
      });
      
      it('should start writing the imported data', (done) => {
        Promise.all(onStart(stream)).then(() => {
          onProcessingComplete(stream);
          
          expect(writePath).toBe(usersCredsPath);
          expect(JSON.parse(writeData).length).toBe(creds.length + loadedCreds.length);
          expect(writeEncoding).toBe('utf8');
          
          done();
        });
      });
      
      it('should handle write errors', (done) => {
        Promise.all(onStart(stream)).then(() => {
          const err = new Error('ruh-roh');
          
          onProcessingComplete(stream).then(() => {
            const { error } = JSON.parse(stream.pop());
            expect(log).toHaveBeenCalledWith(`[ERROR] ${error}`);
          
            done();
          });
          writeCB(err);
        });
      });
      
      it('should handle write success', (done) => {
        Promise.all(onStart(stream)).then(() => {
          onProcessingComplete(stream).then(() => {
            expect(JSON.parse(stream.pop())).toEqual({});
          
            done();
          });
          writeCB();
        });
      });
    });
    
    describe('onEnd', () => {
      it('should log that the import has finished', () => {
        onEnd();
        expect(log).toHaveBeenCalledWith('[IMPORT] Done');
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
