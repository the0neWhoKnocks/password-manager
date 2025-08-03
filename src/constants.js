const { resolve } = require('path');

const API_PREFIX = '/api';
const ROOT_PATH = resolve(__dirname, './');
const CLIENT_PATH = `${ROOT_PATH}/client`;
const DATA_PATH = process.env.DATA_PATH || `${ROOT_PATH}/../data`;

const constants = {
  API_PREFIX,
  CLIENT_PATH,
  CONFIG_PATH: `${DATA_PATH}/config.json`,
  DATA_PATH,
  PUBLIC_JS: `${CLIENT_PATH}/js`,
  ROOT_PATH,
  ROUTE__CONFIG__CREATE: `${API_PREFIX}/config/create`,
  ROUTE__USER__CREATE: `${API_PREFIX}/user/create`,
  ROUTE__USER__CREDS__ADD: `${API_PREFIX}/user/creds/add`,
  ROUTE__USER__CREDS__DELETE: `${API_PREFIX}/user/creds/delete`,
  ROUTE__USER__CREDS__IMPORT: `${API_PREFIX}/user/creds/import`,
  ROUTE__USER__CREDS__LOAD: `${API_PREFIX}/user/creds/load`,
  ROUTE__USER__CREDS__UPDATE: `${API_PREFIX}/user/creds/update`,
  ROUTE__USER__DELETE: `${API_PREFIX}/user/delete`,
  ROUTE__USER__LOGIN: `${API_PREFIX}/user/login`,
  ROUTE__USER__UPDATE: `${API_PREFIX}/user/update`,
  SERVER_PORT: process.env.SERVER_PORT || 3000,
  USERS_PATH: `${DATA_PATH}/users.json`,
};

module.exports = constants;
