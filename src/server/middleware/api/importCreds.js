const { writeFile } = require('fs');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');

module.exports = async function importCreds({ appConfig, req, resp }) {
  try {
    const { creds, user: { username, password } } = await parseReq(req);
    const encryptedUsername = (await encrypt(appConfig, username)).value;
    const filePath = getUsersCredentialsPath(encryptedUsername);
    const loadedCreds = await loadUsersCredentials(filePath);
    const currentCreds = (loadedCreds && typeof loadedCreds === 'string')
      ? JSON.parse(await decrypt(appConfig, loadedCreds, password))
      : [];
    const combinedCreds = [ ...currentCreds, ...creds ];
    const { combined } = await encrypt(appConfig, combinedCreds, password);
    
    writeFile(filePath, JSON.stringify(combined, null, 2), 'utf8', (err) => {
      const data = {};
      
      if (err) returnErrorResp({ label: 'Import Creds write failed', resp })(err);
      else returnResp({ data, resp });
    });
  }
  catch (err) {
    returnErrorResp({ label: 'Import Creds failed', resp })(err);
  }
}
