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

const modifyCreds = require('./modifyCreds');

describe('modifyCreds', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const encryptedUsername = 'asdf9a87dsf98as7df';
  const usersCredsPath = `creds_${encryptedUsername}.json`;
  const req = {};
  const resp = {};
  const creds = {
    label: 'Label',
    password: 'passX',
    email: '',
    customField1_hidden: 'Custom Label 1',
    customField1: 'val',
    customField2_hidden: 'Custom Label 2',
    customField2: 'val',
  };
  const parsedCreds = {
    customFields: {
      [creds.customField1_hidden]: creds.customField1,
      [creds.customField2_hidden]: creds.customField2,
    },
    label: creds.label,
    password: creds.password,
  };
  const username = 'userX';
  const password = 'passX';
  const postData = {
    user: { username, password },
    ...creds,
  };
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
  
  describe('request parsed', () => {
    const encryptedData = 'sdf7a9sd8f79as8d7f:9a8s9df0a9s7df98as7df9a8s7df9as7df9';
    let loadedCreds;
    
    beforeEach(() => {
      loadedCreds = [
        'fakjsdhflijahelkjasdhf:id87foiaudhfiasdfyas8dfhaiouesfyisahdfiuohsd',
        'niuiruhisdjfhsiyihu:798u4irahefoy8a34hriuawo3f8hasifoa8wyerhiaudfiu',
      ];
      
      parseReq.mockReturnValue(Promise.resolve(postData));
      encrypt.mockReturnValueOnce(Promise.resolve({ value: encryptedUsername }));
      encrypt.mockReturnValueOnce(Promise.resolve({ combined: encryptedData }));
      getUsersCredentialsPath.mockReturnValue(usersCredsPath);
      loadUsersCredentials.mockReturnValue(Promise.resolve(loadedCreds));
    });
    
    it('should get the data needed to modify data', async (done) => {
      await modifyCreds({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, username);
        expect(encrypt).toHaveBeenCalledWith(appConfig, parsedCreds, password);
        expect(getUsersCredentialsPath).toHaveBeenCalledWith(encryptedUsername);
        expect(loadUsersCredentials).toHaveBeenCalledWith(usersCredsPath);
        
        done();
      });
    });
    
    it.each([
      ['adding', {}],
      ['errors while adding', { shouldError: true }],
      ['updating', { credsNdx: 0 }],
      ['errors while updating', { credsNdx: 0, shouldError: true }],
    ])('should handle %s data', async (l, { credsNdx, shouldError }, done) => {
      const updating = credsNdx !== undefined;
      parseReq.mockReturnValue(Promise.resolve({ ...postData, credsNdx }));
      await modifyCreds({ appConfig, req, resp });
    
      process.nextTick(() => {
        expect(writePath).toBe(usersCredsPath);
        expect(writeEncoding).toBe('utf8');
        
        const parsedData = JSON.parse(writeData);
        if (updating) expect(parsedData[0]).toBe(encryptedData);
        else expect(parsedData[parsedData.length - 1]).toBe(encryptedData);
        
        if (shouldError) {
          const errPrefix = (updating) ? 'Update' : 'Add';
          const err = 'ruh-roh';
          writeCB(err);
          
          expect(returnErrorResp).toHaveBeenCalledWith({ label: `${errPrefix} Creds write failed`, resp });
          expect(errorCB).toHaveBeenCalledWith(err);
        }
        else {
          const prefix = (updating) ? 'UPDATED' : 'ADDED';
          writeCB();
          
          expect(returnResp).toHaveBeenCalledWith({ data: parsedCreds, prefix, label: 'Creds', resp });
        }
        
        done();
      });
    });
  });
  
  describe('request parse failed', () => {
    it('should return an error response', async (done) => {
      const err = 'ruh-roh';
      parseReq.mockReturnValue(Promise.reject(err));
      await modifyCreds({ appConfig, req, resp });
  
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Modify Creds request parse failed', resp });
        expect(errorCB).toHaveBeenCalledWith(err);
  
        done();
      });
    });
  });
});
