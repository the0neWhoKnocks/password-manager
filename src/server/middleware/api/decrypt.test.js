jest.mock('crypto');
const crypto = require('crypto');

const decrypt = require('./decrypt');

describe('decrypt', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const value = 'as8d7f9w8euyriahfilasuyreoiauhflashdf';
  const iv = 'wekjhri8y7oaeiury';
  const valueWithIV = `${iv}:${value}`;
  const password = 'seeeeecret';
  const scryptKey = 'jaoiuaer8979sidh';
  const ivBuffer = [];
  const encryptedBuffer = [];
  const decryptedVal = 'notSecret';
  let scryptPass;
  let scryptSalt;
  let scryptLength;
  let scryptCB;
  let decipher;
  
  beforeEach(() => {
    decipher = {
      final: jest.fn(),
      update: jest.fn(),
    };
    crypto.createDecipheriv.mockReturnValue(decipher);
    crypto.scrypt.mockImplementation((p, s, l, cb) => {
      scryptPass = p;
      scryptSalt = s;
      scryptLength = l;
      scryptCB = cb;
    });
    global.Buffer = {
      concat: jest.fn(() => decryptedVal),
      from: jest.fn((arg) => {
        if (arg === appConfig.iv || arg === iv) return ivBuffer;
        else if (arg === value) return encryptedBuffer;
      }),
    };
  });
  
  it.each([
    ['App Config', value, null],
    ['User', valueWithIV, password],
  ])('should decrypt data using %s data', (_, _value, _password) => {
    decrypt(appConfig, _value, _password).then((decrypted) => {
      const _iv = (_password) ? iv : appConfig.iv;
      const val = (_password) ? value : _value;
      const pass = _password || appConfig.cipherKey;
      
      expect(scryptPass).toBe(pass);
      expect(scryptSalt).toBe(appConfig.salt);
      expect(scryptLength).toBe(24);
      expect(Buffer.from).toHaveBeenCalledWith(_iv, 'hex');
      expect(Buffer.from).toHaveBeenCalledWith(val, 'hex');
      expect(crypto.createDecipheriv).toHaveBeenCalledWith('aes-192-cbc', scryptKey, ivBuffer);
      expect(decipher.update).toHaveBeenCalledWith(encryptedBuffer);
      expect(decipher.final).toHaveBeenCalled();
      expect(decrypted).toBe(decryptedVal);
    });
    scryptCB(null, scryptKey);
  });
  
  it.each([
    ['App Config', value, null],
    ['User', valueWithIV, password],
  ])('should handle decryption errors with %s data', (_, _value, _password) => {
    const err = new Error('ruh-roh');
    decipher.update.mockImplementation(() => { throw err; });
    decrypt(appConfig, _value, _password).catch((_err) => {
      expect(_err).toBe(err);
    });
    scryptCB(null, scryptKey);
  });
});
