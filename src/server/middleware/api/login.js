const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const loadUsers = require('./loadUsers');

module.exports = function login({ appConfig, req, resp }) {
  parseReq(req)
    .then(({ password, username } = {}) => {
      if (!password || !username) {
        returnErrorResp({ resp })(
          `Looks like you're missing some data.\n  Username: "${username}"\n  Password: "${password}"`
        );
      }
      else {
        Promise.all([
          encrypt(appConfig, username),
          loadUsers(),
        ]).then(([
          { value: encryptedUsername },
          users,
        ]) => {
          if (!users[encryptedUsername]) returnErrorResp({ resp })(
            `An account for "${username}" doesn't exist.`
          );
          else {
            decrypt(appConfig, users[encryptedUsername], password)
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
