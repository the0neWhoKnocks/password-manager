jest.mock('fs');
const { rename, writeFile } = require('fs');
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
jest.mock('./loadUsers');
const loadUsers = require('./loadUsers');
jest.mock('./loadUsersCredentials');
const loadUsersCredentials = require('./loadUsersCredentials');

const { USERS_PATH } = require('../../../constants');
const updateUser = require('./updateUser');

describe('updateUser', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const req = {};
  const resp = {};
  let usersCredsPath;
  let newUsersCredsPath;
  let oldUsersCredsPath;
  let newPassword;
  let newUsername;
  let oldPassword;
  let oldUsername;
  let newData = {};
  let oldData = {};
  let postData = { newData, oldData };
  let errorCB;
  let writePath;
  let writeData;
  let writeEncoding;
  let writeCB;
  let writeCredsPath;
  let writeCredsData;
  let writeCredsEncoding;
  let writeCredsCB;
  let renameOldPath;
  let renameNewPath;
  let renameCB;
  let encryptedCreds;
  let reEncryptedCreds;
  let decryptedCreds;
  let users;
  let encryptedOldUsername;
  let encryptedNewUsername;
  let decryptedUserData;
  let encryptedUserData;
  
  function setPostData({
    newPassword: newPass,
    newUsername: newUser,
    oldPassword: oldPass,
    oldUsername: oldUser,
  }) {
    newPassword = newPass || newPassword;
    newUsername = newUser || newUsername;
    oldPassword = oldPass || oldPassword;
    oldUsername = oldUser || oldUsername;
    postData.newData.username = newUsername;
    postData.newData.password = newPassword;
    postData.oldData.username = oldUsername;
    postData.oldData.password = oldPassword;
  }
  
  beforeEach(() => {
    errorCB = jest.fn();
    returnErrorResp.mockReset();
    returnErrorResp.mockReturnValue(errorCB);
    writeCB = null;
    writeCredsCB = null;
    writeFile.mockImplementation((p, d, e, cb) => {
      if (p === USERS_PATH) {
        writePath = p;
        writeData = d;
        writeEncoding = e;
        writeCB = cb;
      }
      else {
        writeCredsPath = p;
        writeCredsData = d;
        writeCredsEncoding = e;
        writeCredsCB = cb;
      }
    });
    renameCB = null;
    rename.mockImplementation((p1, p2, cb) => {
      renameOldPath = p1;
      renameNewPath = p2;
      renameCB = cb;
    });
    encryptedCreds = [
      'fakjsdhflijahelkjasdhf:id87foiaudhfiasdfyas8dfhaiouesfyisahdfiuohsd',
      'niuiruhisdjfhsiyihu:798u4irahefoy8a34hriuawo3f8hasifoa8wyerhiaudfiu',
    ];
    reEncryptedCreds = [
      '345973940857345asdf:788973y4ihasjhfasdi8y983y9uhaisdf',
      'kjisd798dfasdf:98703745ijhnlkmdsh9o823h5ijadnfa98yhdsf',
    ];
    decryptedCreds = [
      '{ "label": "Test", "password": "pass" }',
      '{ "label": "Test 2", "password": "pass2" }',
    ];
    loadUsersCredentials.mockReturnValue(Promise.resolve(encryptedCreds));
    encryptedOldUsername = 'a87sdf89a7sdf98a7s8fd97asdf';
    encryptedNewUsername = '097w98efa9d8f7a90d8f709ad7f09df709';
    encryptedUserData = '7a9d8f709a7sdf90a7sdf0:asd8f0asd89f0adsf0asd8f09dsf',
    users = {
      'aasd7f9as8d7f9as8d7f': '09a80e9ra09sdf8a0sd9f80ae9r8a0sdfadsfasdf',
      [encryptedOldUsername]: encryptedUserData,
    };
    decryptedUserData = {
      username: 'decryptedUsername',
      password: 'decryptedPassword',
    };
    loadUsers.mockImplementation(() => Promise.resolve(users));
    parseReq.mockImplementation(() => Promise.resolve(postData));
    encrypt.mockImplementation((conf, data) => {
      let eData = {};
      
      if (data === oldUsername) eData.value = encryptedOldUsername;
      else if (data === newUsername) eData.value = encryptedNewUsername;
      else if (data === decryptedCreds[0]) eData.combined = reEncryptedCreds[0];
      else if (data === decryptedCreds[1]) eData.combined = reEncryptedCreds[1];
      else if (data.username && data.password) eData.combined = encryptedUserData;
      
      return Promise.resolve(eData);
    });
    decrypt.mockImplementation((conf, data) => {
      let eData;
      
      if (data === encryptedUserData) eData = JSON.stringify(decryptedUserData);
      else if (data === encryptedCreds[0]) eData = JSON.stringify(decryptedCreds[0]);
      else if (data === encryptedCreds[1]) eData = JSON.stringify(decryptedCreds[1]);
      
      return Promise.resolve(eData);
    });
    getUsersCredentialsPath.mockImplementation((encUsername) => {
      if (encUsername === encryptedNewUsername) {
        newUsersCredsPath = `creds_${encryptedNewUsername}.json`;
        usersCredsPath = newUsersCredsPath;
      }
      else {
        oldUsersCredsPath = `creds_${encryptedOldUsername}.json`;
        usersCredsPath = oldUsersCredsPath;
      }
      
      return usersCredsPath;
    });
    
    setPostData({
      newPassword: 'passNew',
      newUsername: 'userNew',
      oldPassword: 'passOld',
      oldUsername: 'userOld',
    });
  });
  
  describe('request parsed', () => {
    it('should get the data required to update a User', async (done) => {
      await updateUser({ appConfig, req, resp });
    
      process.nextTick(() => {
        expect(encrypt).toHaveBeenCalledWith(appConfig, oldUsername);
        expect(encrypt).toHaveBeenCalledWith(appConfig, newUsername);
        expect(getUsersCredentialsPath).toHaveBeenCalledWith(encryptedOldUsername);
        expect(loadUsers).toHaveBeenCalled();
        
        done();
      });
    });
    
    it('should inform the User that their new username already belongs to someone else', async (done) => {
      setPostData({ newUsername: 'zip', oldUsername: 'fu' });
      encryptedNewUsername = 'asdfasdfasdfasdf';
      users[encryptedNewUsername] = 'asdfasdfasdfas:adfasdfasdfasdfasdfsadf';
      await updateUser({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ resp });
        expect(errorCB).toHaveBeenCalledWith(`User "${newUsername}" already exists`);
        
        done();
      });
    });
    
    describe('update data', () => {
      const newUsernamePayload = {
        newUsername: 'zip',
        oldUsername: 'fu',
        newPassword: 'pass',
        oldPassword: 'pass',
      };
      const newPasswordPayload = {
        newUsername: 'user',
        oldUsername: 'user',
        newPassword: 'zip',
        oldPassword: 'fu',
      };
      
      it.each([
        ['update just the username', {
          payload: newUsernamePayload,
          updating: 'username',
        }],
        ['update just the password', {
          payload: newPasswordPayload,
          updating: 'password',
        }],
        ['handle write error during `users` update', {
          errorType: 'USER_WRITE',
          payload: newUsernamePayload,
          updating: 'username',
        }],
        ['handle rename error during `users` update', {
          errorType: 'CREDS_RENAME',
          payload: newUsernamePayload,
          updating: 'username',
        }],
        ['handle write error during `creds_*.json` update', {
          errorType: 'CREDS_WRITE',
          payload: newPasswordPayload,
          updating: 'password',
        }],
      ])('should %s', async (l, { errorType, payload, updating }, done) => {
        const updatingUsername = updating === 'username';
        const updatingPassword = updating === 'password';
        let err;
        
        setPostData(payload);
        await updateUser({ appConfig, req, resp });
        
        process.nextTick(() => {
          if (errorType) {
            err = new Error('ruh-roh');
            expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Update User failed', resp });
          }
          
          if (errorType === 'USER_WRITE') {
            writeCB(err);
            setImmediate(() => {
              expect(errorCB).toHaveBeenCalledWith(`Failed to update the 'users' file\n${err.stack}`);
              done();
            });
          }
          if (errorType === 'CREDS_RENAME') {
            writeCB();
            renameCB(err);
            setImmediate(() => {
              expect(errorCB).toHaveBeenCalledWith(`Failed to rename "${oldUsersCredsPath}" to "${newUsersCredsPath}"\n${err.stack}`);
              done();
            });
          }
          else if (errorType === 'CREDS_WRITE') {
            writeCB();
            writeCredsCB(err);
            setImmediate(() => {
              expect(errorCB).toHaveBeenCalledWith(`Failed to update "${oldUsersCredsPath}"\n${err.stack}`);
              done();
            });
          }
          else {
            writeCB();
            if (updatingPassword) writeCredsCB();
            if (updatingUsername) renameCB();
            
            setImmediate(() => {
              const currUsername = (updatingUsername) ? newUsername : oldUsername;
              const currPassword = (updatingPassword) ? newPassword : oldPassword;
              const updatedProp = updating;
              const updatedValue = (updatingUsername) ? currUsername : currPassword;
              
              expect(decrypt).toHaveBeenCalledWith(appConfig, encryptedUserData, oldPassword);
              expect(encrypt).toHaveBeenCalledWith(appConfig, { ...decryptedUserData, [updatedProp]: updatedValue }, currPassword);
              expect(writePath).toBe(USERS_PATH);
              expect(writeData).toBe(JSON.stringify(users, null, 2));
              expect(writeEncoding).toBe('utf8');
              
              if (updatingUsername) {
                expect(getUsersCredentialsPath).toHaveBeenCalledWith(encryptedNewUsername);
                expect(users[oldUsername]).toBe(undefined);
                expect(renameOldPath).toBe(oldUsersCredsPath);
                expect(renameNewPath).toBe(newUsersCredsPath);
              }
              
              if (updatingPassword) {
                expect(loadUsersCredentials).toHaveBeenCalledWith(oldUsersCredsPath);
                expect(decrypt).toHaveBeenCalledWith(appConfig, encryptedCreds[0], oldPassword);
                expect(decrypt).toHaveBeenCalledWith(appConfig, encryptedCreds[1], oldPassword);
                expect(encrypt).toHaveBeenCalledWith(appConfig, decryptedCreds[0], currPassword);
                expect(encrypt).toHaveBeenCalledWith(appConfig, decryptedCreds[1], currPassword);
                expect(writeCredsPath).toBe(oldUsersCredsPath);
                expect(writeCredsData).toBe(JSON.stringify(reEncryptedCreds, null, 2));
                expect(writeCredsEncoding).toBe('utf8');
              }
              
              expect(returnResp).toHaveBeenCalledWith({
                prefix: 'UPDATED', label: 'User', resp,
                data: { username: currUsername, password: currPassword },
              });
              
              done();
            });
          }
        });
      });
    });
  });
  
  describe('request parse failed', () => {
    it('should return an error response', async (done) => {
      const err = 'ruh-roh';
      parseReq.mockReturnValue(Promise.reject(err));
      await updateUser({ appConfig, req, resp });
  
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Update User request parse failed', resp });
        expect(errorCB).toHaveBeenCalledWith(err);
  
        done();
      });
    });
  });
});
