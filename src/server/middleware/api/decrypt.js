const crypto = require('crypto');
const { promisify } = require('util');

const asyncScrypt = promisify(crypto.scrypt);

module.exports = async function decrypt(appConfig, value, password) {
  const { cipherKey, iv: configIV, salt } = appConfig;
  
  let _value = value;
  let _password = cipherKey;
  let ivHex = configIV;
  if (password) {
    [ivHex, _value] = _value.split(':');
    _password = password;
  }
  
  const key = await asyncScrypt(_password, salt, 24);
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(_value, 'hex');
  const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
  
  // if someone tries to decrypt data with the incorrect password, this will
  // fail, which is what we want.
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString();
};
