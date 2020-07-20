jest.mock('fs');
const { writeFile } = require('fs');
jest.mock('crypto');
const { randomBytes } = require('crypto');
jest.mock('../../utils/parseReq');
const parseReq = require('../../utils/parseReq');
jest.mock('../../utils/returnErrorResp');
const returnErrorResp = require('../../utils/returnErrorResp');
jest.mock('../../utils/returnResp');
const returnResp = require('../../utils/returnResp');

const { CONFIG_PATH } = require('../../../constants');
const createConfig = require('./createConfig');

describe('createConfig', () => {
  const req = {};
  const resp = {};
  const cipherKey = 'val1';
  const salt = 'val2';
  let postData = { cipherKey, salt };
  let errorCB;
  
  beforeEach(() => {
    parseReq.mockReturnValue(Promise.resolve(postData));
    errorCB = jest.fn();
    returnErrorResp.mockReturnValue(errorCB);
  });
  
  it('should return an error response', async () => {
    parseReq.mockReturnValue(Promise.reject());
    await createConfig({ req, resp });
    expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Create Config request parse failed', resp });
    
    parseReq.mockReturnValue(Promise.resolve());
    await createConfig({ req, resp });
    expect(returnErrorResp).toHaveBeenCalledWith({ resp });
    expect(errorCB).toHaveBeenCalledWith(`Looks like you're missing some data.\n  Cipher Key: "undefined"\n  Salt: "undefined"`);
    
    parseReq.mockReturnValue(Promise.resolve({ cipherKey }));
    await createConfig({ req, resp });
    expect(returnErrorResp).toHaveBeenCalledWith({ resp });
    expect(errorCB).toHaveBeenCalledWith(`Looks like you're missing some data.\n  Cipher Key: "${cipherKey}"\n  Salt: "undefined"`);
    
    parseReq.mockReturnValue(Promise.resolve({ salt }));
    await createConfig({ req, resp });
    expect(returnErrorResp).toHaveBeenCalledWith({ resp });
    expect(errorCB).toHaveBeenCalledWith(`Looks like you're missing some data.\n  Cipher Key: "undefined"\n  Salt: "${salt}"`);
  });
  
  describe('handle writing config', () => {
    let writePath;
    let writeData;
    let writeEncoding;
    let writeCB;
    let bytesToString;
    let iv;
    
    beforeEach(() => {
      writeFile.mockImplementation((p, d, e, cb) => {
        writePath = p;
        writeData = d;
        writeEncoding = e;
        writeCB = cb;
      });
      iv = '23423kj23lkj42342lk3j42l3k4j';
      bytesToString = jest.fn(() => iv);
      randomBytes.mockReturnValue({ toString: bytesToString });
    });
    
    it('should start writing the config', async () => {
      await createConfig({ req, resp });
      
      expect(randomBytes).toHaveBeenCalledWith(16);
      expect(bytesToString).toHaveBeenCalledWith('hex');
      expect(writePath).toBe(CONFIG_PATH);
      expect(writeData).toBe(JSON.stringify({ cipherKey, iv, salt }, null, 2));
      expect(writeEncoding).toBe('utf8');
    });
    
    it('should return an error response', async () => {
      const err = 'ruh-roh';
      await createConfig({ req, resp });
      writeCB(err);
      
      expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Create Config write failed', resp });
      expect(errorCB).toHaveBeenCalledWith(err);
    });
    
    it('should return a success response', async () => {
      await createConfig({ req, resp });
      writeCB();
      
      expect(returnResp).toHaveBeenCalledWith({ label: 'Config', prefix: 'created', resp });
    });
  });
});
