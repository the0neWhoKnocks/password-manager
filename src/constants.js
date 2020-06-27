const { resolve } = require('path');

const ROOT_PATH = resolve(__dirname, './');

module.exports.CLIENT_PATH = `${ROOT_PATH}/client`;
module.exports.DATA_PATH = process.env.DATA_PATH || `${ROOT_PATH}/../data`;
module.exports.SERVER_PORT = 3000;
