const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');

module.exports = async function loadCreds({ appConfig, req, resp }) {
  try {
    const { username, password } = await parseReq(req);
    const encryptedUsername = (await encrypt(appConfig, username)).value;
    const filePath = getUsersCredentialsPath(encryptedUsername);
    const loadedCreds = await loadUsersCredentials(filePath);
    
    if (typeof loadedCreds === 'string') {
      const decrypted = (loadedCreds) // could be blank on first run
        ? JSON.parse(await decrypt(appConfig, loadedCreds, password))
        : [];
      
      returnResp({
        data: { creds: decrypted },
        prefix: 'DECRYPTED',
        label: 'User data',
        resp,
      });
    }
    else {
      returnResp({
        data: { creds: loadedCreds },
        resp,
      });
    }
  }
  catch (err) {
    returnErrorResp({ label: 'Load Creds request parse failed', resp })(err);
  }
}
