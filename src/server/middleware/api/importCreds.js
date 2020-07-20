const { writeFile } = require('fs');
const log = require('../../utils/logger').logger('api:importCreds');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const encrypt = require('./encrypt');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');
const loadUsersCredentials = require('./loadUsersCredentials');
const streamOutput = require('./streamOutput');

module.exports = function importCreds({ appConfig, req, resp }) {
  parseReq(req)
    .then(async ({ creds, user: { username, password } }) => {
      const encryptedUsername = (await encrypt(appConfig, username)).value;
      const filePath = getUsersCredentialsPath(encryptedUsername);
      const loadedCreds = await loadUsersCredentials(filePath);
      const encryptedCreds = [];
      
      streamOutput({
        onStart: (stream) => {
          log('[IMPORT] Started');
          stream.push(JSON.stringify({
            recordsCount: creds.length,
          }));
          
          const pending = [];
          let processedCount = 0;
          for (let i=0; i<creds.length; i++) {
            pending.push(
              new Promise((resolve) => {
                const ndx = i;
                encrypt(appConfig, creds[ndx], password)
                  .then(({ combined }) => {
                    processedCount += 1;
                    stream.push(`\n${JSON.stringify({ processedCount })}`);
                    encryptedCreds[ndx] = combined;
                    log(`  [ENCRYPTED] ${ndx}`);
                    resolve();
                  })
                  .catch((err) => {
                    const data = { error: `Import Creds encryption failed | ${err.stack}` };
                    stream.push(`\n${JSON.stringify(data)}`);
                    log(`[ERROR] ${data.error}`);
                    resolve();
                  });
              })
            );
          }
          
          return pending;
        },
        onProcessingComplete: (stream) => {
          return new Promise((resolve) => {
            const combinedCreds = [ ...loadedCreds, ...encryptedCreds ];
            writeFile(filePath, JSON.stringify(combinedCreds, null, 2), 'utf8', (err) => {
              const data = {};
              
              if (err) {
                data.error = `Import Creds write failed | ${err.stack}`;
                log(`[ERROR] ${data.error}`);
              }
              
              stream.push(`\n${JSON.stringify(data)}`);
              resolve();
            });
          });
        },
        onEnd: () => { log('[IMPORT] Done'); },
        resp,
      });
    })
    .catch(returnErrorResp({ label: `Import Creds request parse failed`, resp }));
}
