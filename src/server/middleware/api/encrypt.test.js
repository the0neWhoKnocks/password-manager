jest.mock('crypto');
const crypto = require('crypto');

const encrypt = require('./encrypt');

describe('encrypt', () => {
  const appConfig = {
    cipherKey: 'ckey',
    iv: 'soiudf987asd9f87as9df',
    salt: 'pepper',
  };
  const password = 'seeeeecret';
  const scryptKey = 'jaoiuaer8979sidh';
  const randomByteIV = 'sd9f87as09d8f7as908d7f';
  const encryptedVal = 'adf7s98df7a9s8df7a9s8df7as9d8f7a9s8dfuoaisudhf';
  let scryptPass;
  let scryptSalt;
  let scryptLength;
  let scryptCB;
  let cipher;
  
  beforeEach(() => {
    cipher = {
      final: jest.fn(),
      update: jest.fn(),
    };
    crypto.createCipheriv.mockReturnValue(cipher);
    crypto.randomBytes.mockReturnValue(randomByteIV);
    crypto.scrypt.mockImplementation((p, s, l, cb) => {
      scryptPass = p;
      scryptSalt = s;
      scryptLength = l;
      scryptCB = cb;
    });
    global.Buffer = {
      concat: jest.fn(() => encryptedVal),
    };
  });
  
  it.only.each([
    ['App Config', 'username', null],
    ['User', { fu: 'bar' }, password],
  ])('should encrypt data using %s data', (_, _value, _password) => {
    encrypt(appConfig, _value, _password).then((encrypted) => {
      const _iv = (_password) ? randomByteIV : appConfig.iv;
      const val = (typeof _value === 'object') ? JSON.stringify(_value) : _value;
      const pass = _password || appConfig.cipherKey;
      
      expect(scryptPass).toBe(pass);
      expect(scryptSalt).toBe(appConfig.salt);
      expect(scryptLength).toBe(24);
      expect(crypto.createCipheriv).toHaveBeenCalledWith('aes-192-cbc', scryptKey, _iv);
      expect(cipher.update).toHaveBeenCalledWith(val);
      expect(cipher.final).toHaveBeenCalled();
      expect(encrypted).toEqual({
        combined: `${_iv}:${encryptedVal}`,
        iv: _iv,
        value: encryptedVal,
      });
    });
    scryptCB(null, scryptKey);
  });
});
