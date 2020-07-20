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
jest.mock('./loadUsers');
const loadUsers = require('./loadUsers');

const { USERS_PATH } = require('../../../constants');
const createUser = require('./createUser');

describe('createUser', () => {
  const appConfig = {};
  const req = {};
  const resp = {};
  const password = 'pass';
  const username = 'user';
  let postData = { password, username };
  let errorCB;
  
  beforeEach(() => {
    parseReq.mockReturnValue(Promise.resolve(postData));
    errorCB = jest.fn();
    returnErrorResp.mockReset();
    returnErrorResp.mockReturnValue(errorCB);
  });
  
  it('should return an error response', async () => {
    parseReq.mockReturnValue(Promise.reject());
    await createUser({ appConfig, req, resp });
    expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Create User request parse failed', resp });
    
    parseReq.mockReturnValue(Promise.resolve());
    await createUser({ appConfig, req, resp });
    expect(returnErrorResp).toHaveBeenCalledWith({ resp });
    expect(errorCB).toHaveBeenCalledWith(`Looks like you're missing some data.\n  Username: "undefined"\n  Password: "undefined"`);
    
    parseReq.mockReturnValue(Promise.resolve({ password }));
    await createUser({ appConfig, req, resp });
    expect(returnErrorResp).toHaveBeenCalledWith({ resp });
    expect(errorCB).toHaveBeenCalledWith(`Looks like you're missing some data.\n  Username: "undefined"\n  Password: "${password}"`);
    
    parseReq.mockReturnValue(Promise.resolve({ username }));
    await createUser({ appConfig, req, resp });
    expect(returnErrorResp).toHaveBeenCalledWith({ resp });
    expect(errorCB).toHaveBeenCalledWith(`Looks like you're missing some data.\n  Username: "${username}"\n  Password: "undefined"`);
  });
  
  describe('create user', () => {
    const encryptedUsername = 'asdf9a87dsf98as7df';
    const encryptedUserData = 'erwersfsewfj8979:bssfgaeradfsadfsadfsd87a6sd8f76a8sdf';
    let users = {};
    let writePath;
    let writeData;
    let writeEncoding;
    let writeCB;
    
    beforeEach(() => {
      writeFile.mockImplementation((p, d, e, cb) => {
        writePath = p;
        writeData = d;
        writeEncoding = e;
        writeCB = cb;
      });
      
      encrypt.mockReturnValueOnce(Promise.resolve({ value: encryptedUsername }));
      encrypt.mockReturnValueOnce(Promise.resolve({ combined: encryptedUserData }));
      loadUsers.mockReturnValue(Promise.resolve(users));
    });
    
    it('should get the required data to create a User', async () => {
      await createUser({ appConfig, req, resp });
      
      expect(encrypt).toHaveBeenCalledWith(appConfig, username);
      expect(encrypt).toHaveBeenCalledWith(appConfig, { password, username}, password);
      expect(loadUsers).toHaveBeenCalled();
    });
    
    it('should inform the User that the username is taken', async (done) => {
      loadUsers.mockReturnValue(Promise.resolve({ [encryptedUsername]: encryptedUserData }));
      await createUser({ appConfig, req, resp });
      
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ resp });
        expect(errorCB).toHaveBeenCalledWith(`User "${username}" already exists`);
        
        done();
      });
    });
    
    it('should start creating the User', async () => {
      await createUser({ appConfig, req, resp });
      
      expect(writePath).toBe(USERS_PATH);
      expect(writeData).toBe(JSON.stringify({
        ...users,
        [encryptedUsername]: encryptedUserData,
      }, null, 2));
      expect(writeEncoding).toBe('utf8');
    });
    
    it('should return an error response', async () => {
      const err = 'ruh-roh';
      await createUser({ appConfig, req, resp });
      writeCB(err);
      
      expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Create User write file failed', resp });
      expect(errorCB).toHaveBeenCalledWith(err);
    });
    
    it('should return a success response', async () => {
      await createUser({ appConfig, req, resp });
      writeCB();
      
      expect(returnResp).toHaveBeenCalledWith({
        label: `User for "${username}"`,
        prefix: 'created',
        resp,
      });
    });
  });
});
