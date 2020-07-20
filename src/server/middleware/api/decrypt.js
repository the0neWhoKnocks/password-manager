const crypto = require('crypto');

const decrypt = (appConfig, value, password) => new Promise((resolve, reject) => {
  const { cipherKey, iv: configIV, salt } = appConfig;
  let _value = value;
  let _password = cipherKey;
  let ivHex = configIV;
  
  if (password) {
    [ivHex, _value] = _value.split(':');
    _password = password;
  }
  
  crypto.scrypt(_password, salt, 24, (err, key) => {
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(_value, 'hex');
    const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
    
    // if someone tries to decrypt data with the incorrect password, this will
    // fail, which is what we want.
    try {
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      resolve(decrypted.toString());
    }
    catch (err) { reject(err); }
  });
});

module.exports = decrypt;
