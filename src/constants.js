const { resolve } = require('path');

const ROOT_PATH = resolve(__dirname, './');
const DATA_PATH = process.env.DATA_PATH || `${ROOT_PATH}/../data`;

module.exports.CLIENT_PATH = `${ROOT_PATH}/client`;
module.exports.CONFIG_PATH = `${DATA_PATH}/config.json`;
module.exports.DATA_PATH = DATA_PATH;
module.exports.SERVER_PORT = 3000;
module.exports.USERS_PATH = `${DATA_PATH}/users.json`;
