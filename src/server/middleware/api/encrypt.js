const crypto = require('crypto');
const { promisify } = require('util');

const asyncScrypt = promisify(crypto.scrypt);

module.exports = async function encrypt(appConfig, value, password) {
  const { cipherKey, iv: configIV, salt } = appConfig;
  
  let pass = cipherKey;
  let iv = configIV;
  if (password) {
    pass = password;
    iv = crypto.randomBytes(16);
  }
  
  const key = await asyncScrypt(pass, salt, 24);
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
  const encrypted = Buffer.concat([
    cipher.update((typeof value === 'object') ? JSON.stringify(value) : value),
    cipher.final()
  ]);
  const ivHex = iv.toString('hex');
  const valueHex = encrypted.toString('hex');
  
  return {
    combined: `${ivHex}:${valueHex}`,
    iv: ivHex,
    value: valueHex,
  };
};
