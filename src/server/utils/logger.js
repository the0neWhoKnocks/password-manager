const debug = require('debug');

const ROOT_NAMESPACE = 'passman';
const rootLogger = debug(ROOT_NAMESPACE);
const logger = (namespace = '') => (namespace)
  ? rootLogger.extend(namespace)
  : rootLogger;

module.exports = {
  ROOT_NAMESPACE,
  logger,
};
