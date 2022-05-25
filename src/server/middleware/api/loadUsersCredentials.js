const { existsSync, readFile } = require('fs');

const loadUsersCredentials = (filePath) => new Promise((resolve) => {
  if (existsSync(filePath)) {
    readFile(filePath, 'utf8', (err, data) => {
      resolve(JSON.parse(data));
    });
  }
  else resolve('');
});

module.exports = loadUsersCredentials;
