const { writeFile } = require('fs');
const log = require('../../utils/logger').logger('api:importCreds');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');

module.exports = function importCreds({ appConfig, req, resp }) {
  parseReq(req)
    .then(async ({ creds, user: { username, password } }) => {
      const encryptedUsername = (await encrypt(appConfig, username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const loadedCreds = await loadUsersCredentials(filePath);
      const currentCreds = (typeof loadedCreds === 'string')
        ? await decrypt(appConfig, loadedCreds, password)
        : loadedCreds;
      const combinedCreds = [ ...currentCreds, ...creds ];
      
      encrypt(appConfig, combinedCreds, password)
        .then(({ combined }) => {
          writeFile(filePath, JSON.stringify(combined, null, 2), 'utf8', (err) => {
            const data = {};
            
            if (err) {
              data.error = `Import Creds write failed | ${err.stack}`;
              log(`[ERROR] ${data.error}`);
            }
            
            returnResp({ data, resp });
          });
        })
        .catch(returnErrorResp({ label: 'Import Creds encryption failed', resp }));
    })
    .catch(returnErrorResp({ label: 'Import Creds request parse failed', resp }));
}
