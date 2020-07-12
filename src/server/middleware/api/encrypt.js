const crypto = require('crypto');

const encrypt = (appConfig, value, password) => new Promise((resolve) => {
  const { cipherKey, iv: configIV, salt } = appConfig;
  let pass = cipherKey;
  let iv = configIV;
  
  if (password) {
    pass = password;
    iv = crypto.randomBytes(16);
  }
  
  crypto.scrypt(pass, salt, 24, (err, key) => {
    const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update((typeof value === 'object') ? JSON.stringify(value) : value),
      cipher.final()
    ]);
    
    const ivHex = iv.toString('hex');
    const valueHex = encrypted.toString('hex');
    
    resolve({
      combined: `${ivHex}:${valueHex}`,
      iv: ivHex,
      value: valueHex,
    });
  });
});

module.exports = encrypt;
