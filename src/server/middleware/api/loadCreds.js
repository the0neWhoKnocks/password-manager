const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');

module.exports = function loadCreds({ appConfig, req, resp }) {
  parseReq(req)
    .then(async ({ username, password }) => {
      const encryptedUsername = (await encrypt(appConfig, username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const loadedCreds = await loadUsersCredentials(filePath);
      
      if (typeof loadedCreds === 'string') {
        decrypt(appConfig, loadedCreds, password)
          .then((decrypted) => {
            returnResp({
              data: { creds: JSON.parse(decrypted) },
              prefix: 'DECRYPTED',
              label: 'User data',
              resp,
            });
          })
          .catch(returnErrorResp({ label: 'Load Creds decryption failed', resp }));
      }
      else {
        returnResp({
          data: { creds: loadedCreds },
          resp,
        });
      }
    })
    .catch(returnErrorResp({ label: 'Load Creds request parse failed', resp }));
}
