const { DATA_PATH } = require('../../../constants');

const getUsersCredentialsPath = (encryptedUsername) => `${DATA_PATH}/creds_${encryptedUsername}.json`;

module.exports = getUsersCredentialsPath;
