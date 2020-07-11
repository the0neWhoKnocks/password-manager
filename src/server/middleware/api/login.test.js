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
jest.mock('./loadUsers');
const loadUsers = require('./loadUsers');

const login = require('./login');

describe('login', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const encryptedUsername = 'asdf9a87dsf98as7df';
  const req = {};
  const resp = {};
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
    });
    
    it('should return an error response', async () => {
      parseReq.mockReturnValue(Promise.resolve());
      await login({ appConfig, req, resp });
      expect(returnErrorResp).toHaveBeenCalledWith({ resp });
      expect(errorCB).toHaveBeenCalledWith(
        `Looks like you're missing some data.\n  Username: "undefined"\n  Password: "undefined"`
      );
      
      parseReq.mockReturnValue(Promise.resolve({ username }));
      await login({ appConfig, req, resp });
      expect(returnErrorResp).toHaveBeenCalledWith({ resp });
      expect(errorCB).toHaveBeenCalledWith(
        `Looks like you're missing some data.\n  Username: "${username}"\n  Password: "undefined"`
      );
      
      parseReq.mockReturnValue(Promise.resolve({ password }));
      await login({ appConfig, req, resp });
      expect(returnErrorResp).toHaveBeenCalledWith({ resp });
      expect(errorCB).toHaveBeenCalledWith(
        `Looks like you're missing some data.\n  Username: "undefined"\n  Password: "${password}"`
      );
    });
    
    describe('required data passed', () => {
      let users;
      
      beforeEach(() => {
        users = {
          'aasd7f9as8d7f9as8d7f': '09a80e9ra09sdf8a0sd9f80ae9r8a0sdfadsfasdf',
          [encryptedUsername]: '874098ruaioshfoiausydihuasdoifuhasoidufailsdyf',
        };
        encrypt.mockReturnValue(Promise.resolve({ value: encryptedUsername }));
        loadUsers.mockReturnValue(Promise.resolve(users));
      });
      
      it('should inform the User that the requested User does Not exist', async (done) => {
        delete users[encryptedUsername];
        await login({ appConfig, req, resp });
        
        process.nextTick(() => {
          expect(returnErrorResp).toHaveBeenCalledWith({ resp });
          expect(errorCB).toHaveBeenCalledWith(
            `An account for "${username}" doesn't exist.`
          );
          
          done();
        });
      });
      
      describe('decrypt', () => {
        it('should decrypt data', async (done) => {
          const data = { fu: 'bar' };
          const decryptedUserData = JSON.stringify(data);
          decrypt.mockReturnValue(Promise.resolve(decryptedUserData));
          await login({ appConfig, req, resp });
          
          process.nextTick(() => {
            expect(returnResp).toHaveBeenCalledWith({ data, resp });
            
            done();
          });
        });
        
        describe('decryption failures', () => {
          it('should handle the incorrect cipher data being passed', async (done) => {
            let err = new Error('There was a bad decrypt');
            decrypt.mockReturnValue(Promise.reject(err));
            await login({ appConfig, req, resp });
            
            process.nextTick(() => {
              expect(returnErrorResp).toHaveBeenCalledWith({ resp });
              expect(errorCB).toHaveBeenCalledWith(
                `Credentials were invalid for Username: "${username}" | Password: "${password}"`
              );
              
              done();
            });
          });
          
          it('should handle all other errors', async (done) => {
            let err = new Error('Server error');
            decrypt.mockReturnValue(Promise.reject(err));
            await login({ appConfig, req, resp });
            
            process.nextTick(() => {
              expect(returnErrorResp).toHaveBeenCalledWith({ resp });
              expect(errorCB).toHaveBeenCalledWith(
                `The Server encountered a problem while trying to log you in:\n${err.stack}`
              );
              
              done();
            });
          });
        });
      });
    });
  });
  
  describe('request parse failed', () => {
    it('should return an error response', async (done) => {
      const err = 'ruh-roh';
      parseReq.mockReturnValue(Promise.reject(err));
      await login({ appConfig, req, resp });
  
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Gen Token request parse failed', resp });
        expect(errorCB).toHaveBeenCalledWith(err);
  
        done();
      });
    });
  });
});
