const { writeFile } = require('fs');
const { randomBytes } = require('crypto');
const { CONFIG_PATH } = require('../../../constants');
const parseReq = require('../../utils/parseReq');
const returnErrorResp = require('../../utils/returnErrorResp');
const returnResp = require('../../utils/returnResp');

module.exports = function createConfig({ req, resp }) {
  parseReq(req)
    .then(({ cipherKey, salt } = {}) => {
      if (!cipherKey || !salt) {
        returnErrorResp({ resp })(
          `Looks like you're missing some data.\n  Cipher Key: "${cipherKey}"\n  Salt: "${salt}"`
        );
      }
      else {
        const data = {
          cipherKey,
          iv: randomBytes(16).toString('hex'),
          salt,
        };
        writeFile(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8', (err) => {
          if (err) returnErrorResp({ label: 'Create Config write failed', resp })(err);
          else returnResp({ label: 'Config', prefix: 'created', resp });
        });
      }
    })
    .catch(returnErrorResp({ label: 'Create Config request parse failed', resp }));
}
