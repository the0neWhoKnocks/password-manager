const { unlink, writeFile } = require('fs');
const { USERS_PATH } = require('../../../constants');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsers = require('./loadUsers');

module.exports = function deleteUser({ appConfig, req, resp }) {
  parseReq(req)
    .then(async ({ username }) => {
      if (!username) returnErrorResp({ resp })('`username` was not passed');
      else {
        const encryptedUsername = (await encrypt(appConfig, username)).value;
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
