jest.mock('fs');
const { unlink, writeFile } = require('fs');
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
jest.mock('./loadUsers');
const loadUsers = require('./loadUsers');

const { USERS_PATH } = require('../../../constants');
const deleteUser = require('./deleteUser');

describe('deleteUser', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const encryptedUsername = 'asdf9a87dsf98as7df';
  const usersCredsPath = `creds_${encryptedUsername}.json`;
  const users = {
    [encryptedUsername]: 'jalk4jroiuasdoifakdfnvlihierhfaijsdflkasdhf',
    '09809usdofiusd': 'jklweiruoa7i4ujlsdkfjalpsdkuo4ijtadlkfnasd',
  };
  const req = {};
  const resp = {};
  const username = 'userX';
  let postData = { username };
  let errorCB;
  
  beforeEach(() => {
    parseReq.mockReturnValue(Promise.resolve(postData));
    errorCB = jest.fn();
    returnErrorResp.mockReset();
    returnErrorResp.mockReturnValue(errorCB);
  });
  
  describe('handle deleting credentials', () => {
    let writePath;
    let writeData;
    let writeEncoding;
    let writeCB;
    let unlinkPath;
    let unlinkCB;
  
    beforeEach(() => {
      encrypt.mockReturnValueOnce(Promise.resolve({ value: encryptedUsername }));
      getUsersCredentialsPath.mockReturnValue(usersCredsPath);
      loadUsers.mockReturnValue(Promise.resolve(users));
      writeFile.mockImplementation((p, d, e, cb) => {
        writePath = p;
        writeData = d;
        writeEncoding = e;
        writeCB = cb;
      });
      unlink.mockImplementation((p, cb) => {
        unlinkPath = p;
        unlinkCB = cb;
      });
    });
    
    it('should return an error response', async () => {
      parseReq.mockReturnValue(Promise.resolve());
      await deleteUser({ appConfig, req, resp });
      
      expect(returnErrorResp).toHaveBeenCalledWith({ resp });
      expect(errorCB).toHaveBeenCalledWith('`username` was not passed');
    });
    
    
    it('should get the data required to delete a User', async (done) => {
      parseReq.mockReturnValue(Promise.resolve({ username }));
      await deleteUser({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, username);
        expect(loadUsers).toHaveBeenCalled();
        expect(getUsersCredentialsPath).toHaveBeenCalledWith(encryptedUsername);
        expect(unlinkPath).toBe(usersCredsPath);
        expect(writePath).toBe(USERS_PATH);
        expect(writeData).toBe(JSON.stringify(users, null, 2));
        expect(writeEncoding).toBe('utf8');
        
        done();
      });
    });
    
    describe('delete User', () => {
      beforeEach(async () => {
        parseReq.mockReturnValue(Promise.resolve({ username }));
        await deleteUser({ appConfig, req, resp });
      });
    
      it.each([
        ['unlink', { unlinkErr: 'unlink error' }],
        ['writeFile', { writeErr: 'write error' }],
      ])('should return an error response for %s errors', (fn, { unlinkErr, writeErr },  done) => {
        process.nextTick(() => {
          unlinkCB(unlinkErr);
          writeCB(writeErr);
          
          setImmediate(() => {
            expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Delete User failed', resp });
            expect(errorCB).toHaveBeenCalledWith(unlinkErr || writeErr);
            
            done();
          });
        });
      });
      
      it('should return a success response', (done) => {
        process.nextTick(() => {
          unlinkCB();
          writeCB();
          
          setImmediate(() => {
            expect(returnResp).toHaveBeenCalledWith({ prefix: 'DELETED', label: `User "${username}"`, resp });
            
            done();
          });
        });
      });
    });
  });
  
  it('should return an error response', async (done) => {
    const err = 'ruh-roh';
    parseReq.mockReturnValue(Promise.reject(err));
    await deleteUser({ appConfig, req, resp });
  
    process.nextTick(() => {
      expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Delete User request parse failed', resp });
      expect(errorCB).toHaveBeenCalledWith(err);
  
      done();
    });
  });
});
