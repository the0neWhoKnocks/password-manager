const { existsSync, readFile } = require('fs');
const { DATA_PATH } = require('../../../constants');

const loadUsers = () => new Promise((resolve, reject) => {
  if (existsSync(`${DATA_PATH}/users.json`)) {
    readFile(`${DATA_PATH}/users.json`, 'utf8', (err, users) => {
      if (err) reject(err);
      else resolve(JSON.parse(users));
    });
  }
  else resolve({});
});

module.exports = loadUsers;
