const { existsSync, readFile, writeFile } = require('fs');
const crypto = require('crypto');
const parseReq = require('../utils/parseReq');
const returnErrorResp = require('../utils/returnErrorResp');
const returnResp = require('../utils/returnResp');
const { CONFIG_PATH, DATA_PATH, USERS_PATH } = require('../../constants');

let userConfig;

const loadConfig = (resp) => new Promise((resolve, reject) => {
  if (existsSync(CONFIG_PATH)) {
    readFile(CONFIG_PATH, 'utf8', (err, config) => {
      if (err) reject(err);
      else {
        userConfig = JSON.parse(config);
        userConfig.iv = Buffer.from(userConfig.iv, 'hex');
        resolve();
      }
    });
  }
  else resolve();
}).catch(returnErrorResp({ label: 'Config load failed', resp }));

const encrypt = (value, password) => new Promise((resolve) => {
  const { cipherKey, iv: configIV, salt } = userConfig;
  let pass = cipherKey;
  let iv = configIV;
  
  if (password) {
    pass = password;
    iv = crypto.randomBytes(16);
  }
  
  const key = crypto.scryptSync(pass, salt, 24);
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value),
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

const decrypt = (value, password) => new Promise((resolve, reject) => {
  const { cipherKey, iv: configIV, salt } = userConfig;
  let _value = value;
  let _password = cipherKey;
  let ivHex = configIV;
  
  if (password) {
    [ivHex, _value] = _value.split(':');
    _password = password;
  }
  
  const key = crypto.scryptSync(_password, salt, 24);
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

const loadUsers = () => new Promise((resolve, reject) => {
  if (existsSync(`${DATA_PATH}/users.json`)) {
    readFile(`${DATA_PATH}/users.json`, (err, users) => {
      if (err) reject(err);
      else resolve(JSON.parse(users));
    });
  }
  else resolve({});
});

function createUser({ req, resp }) {
  parseReq(req)
    .then(({ password, username }) => {
      if (!password || !username) {
        returnErrorResp({ resp })(
          `Looks like you're missing some data.\n  Username: "${username}"\n  Password: "${password}"`
        );
      }
      else {
        Promise.all([
          encrypt(username),
          encrypt(JSON.stringify({
            password,
            username,
          }), password),
          loadUsers(),
        ]).then(([
          { value: encryptedUsername },
          { combined: encryptedUserData },
          users,
        ]) => {
          if (users[encryptedUsername]) {
            returnErrorResp({ resp })(`User "${username}" already exists`);
          }
          else {
            const data = {
              ...users,
              [encryptedUsername]: encryptedUserData,
            };
            writeFile(USERS_PATH, JSON.stringify(data, null, 2), 'utf8', (err) => {
              if (err) returnErrorResp({ label: 'Create User write file failed', resp })(err);
              else returnResp({
                label: `User for "${username}"`,
                prefix: 'created',
                resp,
              });
            });
          }
        });
      }
    })
    .catch(returnErrorResp({ label: 'Create User request parse failed', resp }));
}

function login({ req, resp }) {
  parseReq(req)
    .then(({ password, username }) => {
      if (!password || !username) {
        returnErrorResp({ resp })(
          `Looks like you're missing some data.\n  Username: "${username}"\n  Password: "${password}"`
        );
      }
      else {
        Promise.all([
          encrypt(username),
          loadUsers(),
        ]).then(([
          { value: encryptedUsername },
          users,
        ]) => {
          if (!users[encryptedUsername]) returnErrorResp({ resp })(
            `An account for "${username}" doesn't exist.`
          );
          else {
            decrypt(users[encryptedUsername], password)
              .then((decryptedUserData) => {
                returnResp({
                  data: JSON.parse(decryptedUserData),
                  resp,
                });
              })
              .catch((err) => {
                if (err.message.includes('bad decrypt')) returnErrorResp({ resp })(
                  `Credentials were invalid for Username: "${username}" | Password: "${password}"`
                );
                else returnErrorResp({ resp })(
                  `The Server encountered a problem while trying to log you in:\n${err.stack}`
                );
              });
          }
        });
      }
    })
    .catch(returnErrorResp({ label: 'Gen Token request parse failed', resp }));
}

// function addCreds({ req, resp }) {
//   // encrypt(username, password).then((encrypted) => {
//   // decrypt(encrypted, password).then((decrypted) => {
// }

function createConfig({ req, resp }) {
  parseReq(req)
    .then(({ cipherKey, salt }) => {
      if (!cipherKey || !salt) {
        returnErrorResp({ resp })(
          `Looks like you're missing some data.\n  Cipher Key: "${cipherKey}"\n  Salt: "${salt}"`
        );
      }
      else {
        const data = {
          cipherKey,
          iv: crypto.randomBytes(16).toString('hex'),
          salt,
        };
        writeFile(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8', (err) => {
          if (err) returnErrorResp({ label: 'Create Config write failed', resp })(err);
          else returnResp({ label: 'Config', prefix: 'created', resp });
        });
      }
    })
    .catch(returnErrorResp({ label: 'Create Config request parse failed', resp }));
}

module.exports = function apiMiddleware({ req, resp, urlPath }) {
  if (urlPath.startsWith('/api')) {
    resp.preparingAsyncResponse();
    
    loadConfig(resp).then(() => {
      if (urlPath.endsWith('/config/create')) createConfig({ req, resp });
      // else if (urlPath.endsWith('/user/add-creds')) addCreds({ req, resp });
      else if (urlPath.endsWith('/user/create')) createUser({ req, resp });
      else if (urlPath.endsWith('/user/login')) login({ req, resp });
      else returnErrorResp({ resp })(`The endpoint "${urlPath}" does not exist`);
    });
  }
}