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

const getUsersCredentialsPath = (encryptedUsername) => `${DATA_PATH}/creds_${encryptedUsername}.json`;
const loadUsersCredentials = (filePath) => new Promise((resolve) => {
  if (existsSync(filePath)) {
    readFile(filePath, 'utf8', (err, data) => {
      resolve(JSON.parse(data));
    });
  }
  else resolve([]);
});

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
          encrypt({ password, username }, password),
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

function modifyCreds({ req, resp }) {
  parseReq(req)
    .then(async (creds) => {
      const {
        credsNdx,
        user: { username, password },
        ..._creds
      } = creds;
      const updating = credsNdx !== undefined;
      const errPrefix = (updating) ? 'Update' : 'Add';
      const prefix = (updating) ? 'UPDATED' : 'ADDED';
      
      const parsedCreds = {};
      const credProps = Object.keys(_creds);
      for (let i=0; i<credProps.length; i++) {
        let prop = credProps[i];
        const value = _creds[prop];
        
        // only deal with non-empty fields
        if (value) {
          let ref = parsedCreds;
          
          if (prop.startsWith('customField')) {
            if (prop.endsWith('_hidden')) continue;
            if (!parsedCreds.customFields) parsedCreds.customFields = {};
            ref = parsedCreds.customFields;
            prop = _creds[`${prop}_hidden`];
          }
          
          ref[prop] = value;
        }
      }
      
      const encryptedUsername = (await encrypt(username)).value;
      const encryptedData = (await encrypt(parsedCreds, password)).combined;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const usersCreds = await loadUsersCredentials(filePath);
      
      if (updating) usersCreds[credsNdx] = encryptedData;
      else usersCreds.push(encryptedData);
      
      writeFile(filePath, JSON.stringify(usersCreds, null, 2), 'utf8', (err) => {
        if (err) returnErrorResp({ label: `${errPrefix} Creds write failed`, resp })(err);
        else returnResp({ prefix, label: 'Creds', resp });
      });
    })
    .catch(returnErrorResp({ label: `Modify Creds request parse failed`, resp }));
}

function deleteCreds({ req, resp }) {
  parseReq(req)
    .then(async (data) => {
      const { credsNdx, username } = data;
      const encryptedUsername = (await encrypt(username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const usersCreds = await loadUsersCredentials(filePath);
      
      usersCreds.splice(credsNdx, 1);
      
      writeFile(filePath, JSON.stringify(usersCreds, null, 2), 'utf8', (err) => {
        if (err) returnErrorResp({ label: 'Delete Creds write failed', resp })(err);
        else returnResp({ prefix: 'DELETE', label: 'Creds', resp });
      });
    })
    .catch(returnErrorResp({ label: `Delete Creds request parse failed`, resp }));
}

function loadCreds({ req, resp }) {
  parseReq(req)
    .then(async ({ username, password }) => {
      const encryptedUsername = (await encrypt(username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const usersCreds = (await loadUsersCredentials(filePath)).map(async (creds) => {
        return JSON.parse(await decrypt(creds, password));
      });
      
      Promise.all(usersCreds).then((data) => {
        returnResp({
          prefix: 'LOADED',
          label: 'Creds',
          data,
          resp,
        });
      });
    })
    .catch(returnErrorResp({ label: 'Add Creds request parse failed', resp }));
}

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
      else if (urlPath.endsWith('/user/create')) createUser({ req, resp });
      else if (urlPath.endsWith('/user/creds/add')) modifyCreds({ req, resp });
      else if (urlPath.endsWith('/user/creds/delete')) deleteCreds({ req, resp });
      else if (urlPath.endsWith('/user/creds/load')) loadCreds({ req, resp });
      else if (urlPath.endsWith('/user/creds/update')) modifyCreds({ req, resp });
      else if (urlPath.endsWith('/user/login')) login({ req, resp });
      else returnErrorResp({ label: 'Missing API path', resp })(new Error(`The endpoint "${urlPath}" does not exist`));
    });
  }
}