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
    { cred: 1 },
    { cred: 2 },
  ];
  const loadedCreds = [
    'fakjsdhflijahelkjasdhf:id87foiaudhfiasdfyas8dfhaiouesfyisahdfiuohsd',
    'niuiruhisdjfhsiyihu:798u4irahefoy8a34hriuawo3f8hasifoa8wyerhiaudfiu',
  ];
  const decryptedCreds = JSON.stringify(creds);
  const password = 'passX';
  const username = 'userX';
  let postData = { password, username };
  let errorCB;
  
  beforeEach(() => {
    errorCB = jest.fn();
    returnErrorResp.mockReset();
    returnErrorResp.mockReturnValue(errorCB);
  });
  
  describe('request parsed', () => {
    beforeEach(() => {
      parseReq.mockReturnValue(Promise.resolve(postData));
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
    
        done();
      });
    });
    
    describe('decrypt', () => {
      beforeEach(() => {
        parseReq.mockReturnValue(Promise.resolve(postData));
        loadUsersCredentials.mockReturnValue('fasdfa:adsfasdfasdfasdfasdf');
      });
      
      it('should decrypt data and send it back to the Client', async (done) => {
        decrypt.mockReturnValue(Promise.resolve(decryptedCreds));
        await loadCreds({ appConfig, req, resp });
      
        process.nextTick(() => {
          expect(returnResp).toHaveBeenCalledWith({
            data: { creds },
            prefix: 'DECRYPTED',
            label: 'User data',
            resp,
          });
      
          done();
        });
      });
      
      it('should handle decryption errors', async (done) => {
        decrypt.mockReturnValue(Promise.reject('error'));
        await loadCreds({ appConfig, req, resp });
      
        process.nextTick(() => {
          expect(returnErrorResp).toHaveBeenCalledWith({
            label: 'Load Creds decryption failed',
            resp,
          });
      
          done();
        });
      });
    });
  
    it('should return a default value if creds do NOT exist', async (done) => {
      parseReq.mockReturnValue(Promise.resolve(postData));
      loadUsersCredentials.mockReturnValue(Promise.resolve([]));
      await loadCreds({ appConfig, req, resp });
    
      process.nextTick(() => {
        expect(returnResp).toHaveBeenCalledWith({
          data: { creds: [] },
          resp,
        });
    
        done();
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
