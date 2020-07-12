const log = require('../../utils/logger').logger('api:loadCreds');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const decrypt = require('./decrypt');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');
const streamOutput = require('./streamOutput');

module.exports = function loadCreds({ appConfig, req, resp }) {
  parseReq(req)
    .then(async ({ username, password }) => {
      const encryptedUsername = (await encrypt(appConfig, username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const loadedCreds = await loadUsersCredentials(filePath);
      const decryptedItems = [];
      
      streamOutput({
        onStart: (stream) => {
          log('[LOAD] Started');
          stream.push(JSON.stringify({
            recordsCount: loadedCreds.length,
          }));
          
          const pending = [];
          let processedCount = 0;
          for (let i=0; i<loadedCreds.length; i++) {
            // NOTE - Using Promises instead of async/await was 4 times faster.
            pending.push(new Promise((resolve) => {
              const ndx = i;
              decrypt(appConfig, loadedCreds[ndx], password).then((decrypted) => {
                processedCount += 1;
                stream.push(`\n${JSON.stringify({ processedCount })}`);
                decryptedItems[ndx] = JSON.parse(decrypted);
                log(`  [DECRYPTED] ${ndx}`);
                resolve();
              });
            }));
          }
          
          return pending;
        },
        onProcessingComplete: (stream) => {
          return new Promise((resolve) => {
            stream.push(`\n${JSON.stringify({
              creds: decryptedItems,
            })}`);
            resolve();
          });
        },
        onEnd: () => { log('[LOAD] Done'); },
        resp,
      });
    })
    .catch(returnErrorResp({ label: 'Add Creds request parse failed', resp }));
}
