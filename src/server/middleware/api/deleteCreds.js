const { writeFile } = require('fs');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');

module.exports = function deleteCreds({ appConfig, req, resp }) {
  parseReq(req)
    .then(async (data) => {
      const { credsNdx, password, username } = data;
      const encryptedUsername = (await encrypt(appConfig, username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const loadedCreds = await loadUsersCredentials(filePath);
      const usersCreds = JSON.parse(await decrypt(appConfig, loadedCreds, password));
      
      usersCreds.splice(credsNdx, 1);
      
      encrypt(appConfig, usersCreds, password)
        .then(({ combined }) => {
          writeFile(filePath, JSON.stringify(combined, null, 2), 'utf8', (err) => {
            if (err) returnErrorResp({ label: 'Delete Creds write failed', resp })(err);
            else returnResp({ prefix: 'DELETE', label: 'Creds', resp });
          });
        })
        .catch(returnErrorResp({ label: 'Delete Creds encryption failed', resp }));
    })
    .catch(returnErrorResp({ label: 'Delete Creds request parse failed', resp }));
}
