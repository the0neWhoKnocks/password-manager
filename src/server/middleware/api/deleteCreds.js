const { writeFile } = require('fs');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');

module.exports = function deleteCreds({ appConfig, req, resp }) {
  parseReq(req)
    .then(async (data) => {
      const { credsNdx, username } = data;
      const encryptedUsername = (await encrypt(appConfig, username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const usersCreds = await loadUsersCredentials(filePath);
      
      usersCreds.splice(credsNdx, 1);
      
      writeFile(filePath, JSON.stringify(usersCreds, null, 2), 'utf8', (err) => {
        if (err) returnErrorResp({ label: 'Delete Creds write failed', resp })(err);
        else returnResp({ prefix: 'DELETE', label: 'Creds', resp });
      });
    })
    .catch(returnErrorResp({ label: 'Delete Creds request parse failed', resp }));
}
