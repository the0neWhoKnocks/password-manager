const { rename, writeFile } = require('fs');
const { USERS_PATH } = require('../../../constants');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsers = require('./loadUsers');
const loadUsersCredentials = require('./loadUsersCredentials');

module.exports = function updateUser({ appConfig, req, resp }) {
  parseReq(req)
    .then(async ({ newData, oldData }) => {
      const { username: oldUsername, password: oldPassword } = oldData;
      const { username: newUsername, password: newPassword } = newData;
      const encryptedOldUsername = (await encrypt(appConfig, oldUsername)).value;
      const encryptedNewUsername = (await encrypt(appConfig, newUsername)).value;
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
        const decryptedUserData = JSON.parse(await decrypt(appConfig, encryptedUserData, oldPassword));
        
        // update Users's data
        if (newUsername !== oldUsername) decryptedUserData.username = newUsername;
        if (newPassword !== oldPassword) decryptedUserData.password = newPassword;
        encryptedUserData = (await encrypt(appConfig, decryptedUserData, PASSWORD)).combined;
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
          const loadedCreds = await loadUsersCredentials(oldCredsPath);
          const decryptedCreds = JSON.parse(await decrypt(appConfig, loadedCreds, oldPassword));
          pendingReEncryption = encrypt(appConfig, decryptedCreds, newPassword)
            .then(({ combined }) => new Promise((resolve, reject) => {
              writeFile(oldCredsPath, JSON.stringify(combined, null, 2), 'utf8', (err) => {
                if (err) reject(`Failed to update "${oldCredsPath}"\n${err.stack}`);
                else resolve();
              });
            }));
          
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
