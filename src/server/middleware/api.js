const { existsSync, readFile, writeFile } = require('fs');
const crypto = require('crypto');
const auth = require('authenticator');
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

  resolve({
    iv: iv.toString('hex'),
    value: encrypted.toString('hex'),
  });
});

const decrypt = (value, password) => new Promise((resolve) => {
  const { cipherKey, iv: configIV, salt } = userConfig;
  let pass = cipherKey;
  let ivHex = configIV;
  
  if (password) {
    pass = password;
  }
  
  const key = crypto.scryptSync(pass, salt, 24);
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(value, 'hex');
  const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  resolve(decrypted.toString());
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
            authKey: auth.generateKey(),
            password,
            username,
          })),
          loadUsers(),
        ]).then(([
          { value: encryptedUsername },
          { value: encryptedUserData },
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

function genToken({ req, resp }) {
  parseReq(req)
    .then(({ authKey }) => {
      returnResp({
        data: { token: auth.generateToken(authKey) },
        resp,
      });
    })
    .catch(returnErrorResp({ label: 'Gen Token request parse failed', resp }));
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
            decrypt(users[encryptedUsername]).then((decryptedUserData) => {
              returnResp({
                data: JSON.parse(decryptedUserData),
                resp,
              });
            });
          }
        });
      }
    })
    .catch(returnErrorResp({ label: 'Gen Token request parse failed', resp }));
  
  // auth.verifyToken(formattedKey, formattedToken);
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
      else if (urlPath.endsWith('/user/gen-token')) genToken({ req, resp });
      else if (urlPath.endsWith('/user/login')) login({ req, resp });
      else returnErrorResp({ resp })(`The endpoint "${urlPath}" does not exist`);
    });
  }
}