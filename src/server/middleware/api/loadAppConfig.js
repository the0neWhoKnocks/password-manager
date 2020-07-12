const { existsSync, readFile } = require('fs');
const returnErrorResp = require('../../utils/returnErrorResp');
const { CONFIG_PATH } = require('../../../constants');

const loadAppConfig = (resp) => new Promise((resolve, reject) => {
  if (existsSync(CONFIG_PATH)) {
    readFile(CONFIG_PATH, 'utf8', (err, config) => {
      if (err) reject(err);
      else {
        const _config = JSON.parse(config);
        _config.iv = Buffer.from(_config.iv, 'hex');
        resolve(_config);
      }
    });
  }
  else resolve();
}).catch(returnErrorResp({ label: 'Config load failed', resp }));

module.exports = loadAppConfig;
