const { existsSync, readFile, rename, unlink, writeFile } = require('fs');
const crypto = require('crypto');
const log = require('../utils/logger').logger('middleware:api');
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

const decrypt = (value, password) => new Promise((resolve, reject) => {
  const { cipherKey, iv: configIV, salt } = userConfig;
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

const loadUsers = () => new Promise((resolve, reject) => {
  if (existsSync(`${DATA_PATH}/users.json`)) {
    readFile(`${DATA_PATH}/users.json`, (err, users) => {
      if (err) reject(err);
      else resolve(JSON.parse(users));
    });
  }
  else resolve({});
});

const streamOutput = ({
  onEnd,
  onProcessingComplete,
  onStart,
  resp,
}) => {
  const { Readable } = require('stream');
  const readData = new Readable({ read() {} });
  
  resp.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'X-Content-Type-Options': 'nosniff',
  });
  
  readData.pipe(resp);
  readData.on('end', () => {
    if (onEnd) onEnd();
    resp.end();
  });
  
  const pending = onStart(readData);
  
  Promise.all(pending).then(() => {
    onProcessingComplete(readData).then(() => {
      readData.push(null);
    });
  });
};

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

function deleteUser({ req, resp }) {
  parseReq(req)
    .then(async ({ username }) => {
      if (!username) returnErrorResp({ resp })('`username` was not passed');
      else {
        const encryptedUsername = (await encrypt(username)).value;
        const users = await loadUsers();
        const filePath = getUsersCredentialsPath(encryptedUsername);
        
        const deleteUsersCreds = new Promise((resolve, reject) => {
          unlink(filePath, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        const deleteUser = new Promise((resolve, reject) => {
          delete users[encryptedUsername];
          writeFile(USERS_PATH, JSON.stringify(users, null, 2), 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        Promise.all([deleteUsersCreds, deleteUser])
          .then(() => {
            returnResp({ prefix: 'DELETED', label: `User "${username}"`, resp });
          })
          .catch(returnErrorResp({ label: 'Delete User failed', resp }));
      }
    })
    .catch(returnErrorResp({ label: 'Delete User request parse failed', resp }));
}

function updateUser({ req, resp }) {
  parseReq(req)
    .then(async ({ newData, oldData }) => {
      const { username: oldUsername, password: oldPassword } = oldData;
      const { username: newUsername, password: newPassword } = newData;
      const encryptedOldUsername = (await encrypt(oldUsername)).value;
      const encryptedNewUsername = (await encrypt(newUsername)).value;
      const oldCredsPath = getUsersCredentialsPath(encryptedOldUsername);
      const users = await loadUsers();
      const pending = [];
      const PASSWORD = (newPassword !== oldPassword) ? newPassword : oldPassword;
      const USERNAME = (newUsername !== oldUsername) ? newUsername : oldUsername;
      const CREDS_PATH = (newUsername !== oldUsername)
        ? getUsersCredentialsPath(encryptedNewUsername)
        : oldCredsPath;
      let pendingReEncryption = Promise.resolve();
      
      if (
        (newUsername !== oldUsername)
        && users[encryptedNewUsername]
      ) {
        returnErrorResp({ resp })(`User "${newUsername}" already exists`);
      }
      else {
        let encryptedUserData = users[encryptedOldUsername];
        const decryptedUserData = JSON.parse(await decrypt(encryptedUserData, oldPassword));
        
        // update Users's data
        if (newUsername !== oldUsername) decryptedUserData.username = newUsername;
        if (newPassword !== oldPassword) decryptedUserData.password = newPassword;
        encryptedUserData = (await encrypt(decryptedUserData, PASSWORD)).combined;
        users[encryptedOldUsername] = encryptedUserData;
        
        // change the User's key in users.json
        if (newUsername !== oldUsername) {
          users[encryptedNewUsername] = encryptedUserData;
          delete users[encryptedOldUsername];
        }
        
        pending.push(
          new Promise((resolve, reject) => {
            writeFile(USERS_PATH, JSON.stringify(users, null, 2), 'utf8', (err) => {
              if (err) reject(`Failed to update the 'users' file\n${err.stack}`);
              else resolve();
            });
          })
        );
        
        if (newPassword !== oldPassword) {
          const reEncryptedCreds = (await loadUsersCredentials(oldCredsPath)).map(async (creds) => {
            const decryptedCreds = JSON.parse(await decrypt(creds, oldPassword));
            return (await encrypt(decryptedCreds, newPassword)).combined;
          });
          
          pendingReEncryption = Promise.all(reEncryptedCreds).then((reCreds) => {
            return new Promise((resolve, reject) => {
              writeFile(oldCredsPath, JSON.stringify(reCreds, null, 2), 'utf8', (err) => {
                if (err) reject(`Failed to update "${oldCredsPath}"\n${err.stack}`);
                else resolve();
              });
            });
          });
          
          pending.push(pendingReEncryption);
        }
        
        if (CREDS_PATH !== oldCredsPath) {
          const pendingRename = pendingReEncryption.then(() => {
            return new Promise((resolve, reject) => {
              rename(oldCredsPath, CREDS_PATH, (err) => {
                if (err) reject(`Failed to rename "${oldCredsPath}" to "${CREDS_PATH}"\n${err.stack}`);
                else resolve();
              });
            });
          });
          
          pending.push(pendingRename);
        }
        
        Promise.all(pending)
          .then(() => {
            returnResp({
              prefix: 'UPDATED', label: 'User', resp,
              data: { username: USERNAME, password: PASSWORD },
            });
          })
          .catch(returnErrorResp({ label: 'Update User failed', resp }));
      }
    })
    .catch(returnErrorResp({ label: 'Update User request parse failed', resp }));
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
        else returnResp({ data: parsedCreds, prefix, label: 'Creds', resp });
      });
    })
    .catch(returnErrorResp({ label: `Modify Creds request parse failed`, resp }));
}

function importCreds({ req, resp }) {
  parseReq(req)
    .then(async ({ creds, user: { username, password } }) => {
      const encryptedUsername = (await encrypt(username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const loadedCreds = await loadUsersCredentials(filePath);
      const encryptedCreds = [];
      
      streamOutput({
        onStart: (stream) => {
          log('[IMPORT] Started');
          stream.push(JSON.stringify({
            recordsCount: creds.length,
          }));
          
          const pending = [];
          let encryptedCount = 0;
          for (let i=0; i<creds.length; i++) {
            pending.push(
              new Promise((resolve) => {
                const ndx = i;
                encrypt(creds[ndx], password)
                  .then(({ combined }) => {
                    encryptedCount += 1;
                    stream.push(`\n${JSON.stringify({ encryptedCount })}`);
                    encryptedCreds[ndx] = combined;
                    log(`  [ENCRYPTED] ${ndx}`);
                    resolve();
                  })
                  .catch((err) => {
                    const data = { error: `Import Creds encryption failed | ${err.stack}` };
                    stream.push(`\n${JSON.stringify(data)}`);
                    log(`[ERROR] ${data.error}`);
                    resolve();
                  });
              })
            );
          }
          
          return pending;
        },
        onProcessingComplete: (stream) => {
          return new Promise((resolve) => {
            const combinedCreds = [ ...loadedCreds, ...encryptedCreds ];
            writeFile(filePath, JSON.stringify(combinedCreds, null, 2), 'utf8', (err) => {
              const data = {};
              
              if (err) {
                data.error = `Import Creds write failed | ${err.stack}`;
                log(`[ERROR] ${data.error}`);
              }
              
              stream.push(`\n${JSON.stringify(data)}`);
              resolve();
            });
          });
        },
        onEnd: () => { log('[IMPORT] Done'); },
        resp,
      });
    })
    .catch(returnErrorResp({ label: `Import Creds request parse failed`, resp }));
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
      const loadedCreds = await loadUsersCredentials(filePath);
      const decryptedItems = [];
      
      streamOutput({
        onStart: (stream) => {
          log('[LOAD] Started');
          stream.push(JSON.stringify({
            recordsCount: loadedCreds.length,
          }));
          
          const pending = [];
          let decryptedCount = 0;
          for (let i=0; i<loadedCreds.length; i++) {
            // NOTE - Using Promises instead of async/await was 4 times faster.
            pending.push(new Promise((resolve) => {
              const ndx = i;
              decrypt(loadedCreds[ndx], password).then((decrypted) => {
                decryptedCount += 1;
                stream.push(`\n${JSON.stringify({ decryptedCount })}`);
                decryptedItems[ndx] = JSON.parse(decrypted);
                log(`  [DECRYPTED] ${ndx}`);
                resolve();
              });
            }));
          }
          
          return pending;
        },
        onProcessingComplete: (stream) => {
          return new Promise((resolve) => {
            stream.push(`\n${JSON.stringify({
              creds: decryptedItems,
            })}`);
            resolve();
          });
        },
        onEnd: () => { log('[LOAD] Done'); },
        resp,
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
      else if (urlPath.endsWith('/user/creds/import')) importCreds({ req, resp });
      else if (urlPath.endsWith('/user/creds/load')) loadCreds({ req, resp });
      else if (urlPath.endsWith('/user/creds/update')) modifyCreds({ req, resp });
      else if (urlPath.endsWith('/user/delete')) deleteUser({ req, resp });
      else if (urlPath.endsWith('/user/login')) login({ req, resp });
      else if (urlPath.endsWith('/user/update')) updateUser({ req, resp });
      else returnErrorResp({ label: 'Missing API path', resp })(new Error(`The endpoint "${urlPath}" does not exist`));
    });
  }
}