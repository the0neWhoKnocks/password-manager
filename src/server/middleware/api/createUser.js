const { writeFile } = require('fs');
const { USERS_PATH } = require('../../../constants');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const encrypt = require('./encrypt');
const loadUsers = require('./loadUsers');

module.exports = function createUser({ appConfig, req, resp }) {
  parseReq(req)
    .then(({ password, username }) => {
      if (!password || !username) {
        returnErrorResp({ resp })(
          `Looks like you're missing some data.\n  Username: "${username}"\n  Password: "${password}"`
        );
      }
      else {
        Promise.all([
          encrypt(appConfig, username),
          encrypt(appConfig, { password, username }, password),
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
