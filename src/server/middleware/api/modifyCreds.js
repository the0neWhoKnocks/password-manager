const { writeFile } = require('fs');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');

module.exports = function modifyCreds({ appConfig, req, resp }) {
  parseReq(req)
    .then(async (creds) => {
      const {
        credsNdx,
        user: { username, password },
        ..._creds
      } = creds;
      const updating = credsNdx !== undefined;
      const errPrefix = (updating) ? 'Update' : 'Add';
      const prefix = (updating) ? 'UPDATED' : 'ADDED';
      
      const parsedCreds = {};
      const credProps = Object.keys(_creds);
      for (let i=0; i<credProps.length; i++) {
        let prop = credProps[i];
        const value = _creds[prop];
        
        // only deal with non-empty fields
        if (value) {
          let ref = parsedCreds;
          
          if (prop.startsWith('customField')) {
            if (prop.endsWith('_hidden')) continue;
            if (!parsedCreds.customFields) parsedCreds.customFields = {};
            ref = parsedCreds.customFields;
            prop = _creds[`${prop}_hidden`];
          }
          
          ref[prop] = value;
        }
      }
      
      const encryptedUsername = (await encrypt(appConfig, username)).value;
      const encryptedData = (await encrypt(appConfig, parsedCreds, password)).combined;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const usersCreds = await loadUsersCredentials(filePath);
      
      if (updating) usersCreds[credsNdx] = encryptedData;
      else usersCreds.push(encryptedData);
      
      writeFile(filePath, JSON.stringify(usersCreds, null, 2), 'utf8', (err) => {
        if (err) returnErrorResp({ label: `${errPrefix} Creds write failed`, resp })(err);
        else returnResp({ data: parsedCreds, prefix, label: 'Creds', resp });
      });
    })
    .catch(returnErrorResp({ label: 'Modify Creds request parse failed', resp }));
}
