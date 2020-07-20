jest.mock('fs');
const { writeFile } = require('fs');
jest.mock('../../utils/parseReq');
const parseReq = require('../../utils/parseReq');
jest.mock('../../utils/returnErrorResp');
const returnErrorResp = require('../../utils/returnErrorResp');
jest.mock('../../utils/returnResp');
const returnResp = require('../../utils/returnResp');
jest.mock('./encrypt');
const encrypt = require('./encrypt');
jest.mock('./getUsersCredentialsPath');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
jest.mock('./loadUsersCredentials');
const loadUsersCredentials = require('./loadUsersCredentials');

const deleteCreds = require('./deleteCreds');

describe('deleteCreds', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const encryptedUsername = 'asdf9a87dsf98as7df';
  const usersCredsPath = `creds_${encryptedUsername}.json`;
  const secondCred = 'ie754ihfsdufso:jlaksdjfop87495iuajldoknalksdfuoieuytiahdf';
  const usersCredentials = [
    'asd9f8asd7fad:jalk4jroiuasdoifakdfnvlihierhfaijsdflkasdhf',
    secondCred,
    '09809usdofiusd:jklweiruoa7i4ujlsdkfjalpsdkuo4ijtadlkfnasd',
  ];
  const req = {};
  const resp = {};
  const credsNdx = 1;
  const username = 'userX';
  let postData = { credsNdx, username };
  let errorCB;
  
  beforeEach(() => {
    parseReq.mockReturnValue(Promise.resolve(postData));
    errorCB = jest.fn();
    returnErrorResp.mockReturnValue(errorCB);
  });
  
  describe('handle deleting credentials', () => {
    let writePath;
    let writeData;
    let writeEncoding;
    let writeCB;
    
    beforeEach(() => {
      encrypt.mockReturnValueOnce(Promise.resolve({ value: encryptedUsername }));
      getUsersCredentialsPath.mockReturnValue(usersCredsPath);
      loadUsersCredentials.mockReturnValue(Promise.resolve(usersCredentials));
      writeFile.mockImplementation((p, d, e, cb) => {
        writePath = p;
        writeData = d;
        writeEncoding = e;
        writeCB = cb;
      });
    });
    
    it('should start deleting credentials', async (done) => {
      expect(usersCredentials.includes(secondCred)).toBe(true);
      
      await deleteCreds({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, username);
        expect(getUsersCredentialsPath).toHaveBeenCalledWith(encryptedUsername);
        expect(loadUsersCredentials).toHaveBeenCalledWith(usersCredsPath);
        expect(usersCredentials.includes(secondCred)).toBe(false);
        expect(writePath).toBe(usersCredsPath);
        expect(writeData).toBe(JSON.stringify(usersCredentials, null, 2));
        expect(writeEncoding).toBe('utf8');
        
        done();
      });
    });
    
    it('should return an error response', async (done) => {
      const err = 'ruh-roh';
      await deleteCreds({ appConfig, req, resp });
      writeCB(err);
      
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Delete Creds write failed', resp });
        expect(errorCB).toHaveBeenCalledWith(err);
        
        done();
      });
    });
    
    it('should return a success response', async (done) => {
      await deleteCreds({ appConfig, req, resp });
      writeCB();
      
      process.nextTick(() => {
        expect(returnResp).toHaveBeenCalledWith({ prefix: 'DELETE', label: 'Creds', resp });
        
        done();
      });
    });
  });
  
  it('should return an error response', async (done) => {
    const err = 'ruh-roh';
    parseReq.mockReturnValue(Promise.reject(err));
    await deleteCreds({ appConfig, req, resp });
    
    process.nextTick(() => {
      expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Delete Creds request parse failed', resp });
      expect(errorCB).toHaveBeenCalledWith(err);
      
      done();
    });
  });
});
