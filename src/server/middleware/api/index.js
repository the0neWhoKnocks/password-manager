module.exports = function apiMiddleware({ req, resp, urlPath }) {
  const {
    API_PREFIX,
    ROUTE__CONFIG__CREATE,
    ROUTE__USER__CREATE,
    ROUTE__USER__CREDS__ADD,
    ROUTE__USER__CREDS__DELETE,
    ROUTE__USER__CREDS__IMPORT,
    ROUTE__USER__CREDS__LOAD,
    ROUTE__USER__CREDS__UPDATE,
    ROUTE__USER__DELETE,
    ROUTE__USER__LOGIN,
    ROUTE__USER__UPDATE,
  } = require('../../../constants');
  
  if (urlPath.startsWith(API_PREFIX)) {
    const returnErrorResp = require('../../utils/returnErrorResp');
    
    resp.preparingAsyncResponse();
    
    require('./loadAppConfig')(resp).then((appConfig) => {
      switch (urlPath) {
        case ROUTE__CONFIG__CREATE: {
          require('./createConfig')({ req, resp });
          break;
        }
        case ROUTE__USER__CREATE: {
          require('./createUser')({ appConfig, req, resp });
          break;
        }
        case ROUTE__USER__CREDS__ADD:
        case ROUTE__USER__CREDS__UPDATE: {
          require('./modifyCreds')({ appConfig, req, resp });
          break;
        }
        case ROUTE__USER__CREDS__DELETE: {
          require('./deleteCreds')({ appConfig, req, resp });
          break;
        }
        case ROUTE__USER__CREDS__IMPORT: {
          require('./importCreds')({ appConfig, req, resp });
          break;
        }
        case ROUTE__USER__CREDS__LOAD: {
          require('./loadCreds')({ appConfig, req, resp });
          break;
        }
        case ROUTE__USER__DELETE: {
          require('./deleteUser')({ appConfig, req, resp });
          break;
        }
        case ROUTE__USER__LOGIN: {
          require('./login')({ appConfig, req, resp });
          break;
        }
        case ROUTE__USER__UPDATE: {
          require('./updateUser')({ appConfig, req, resp });
          break;
        }
        default: {
          returnErrorResp({ label: 'Missing API path', resp })(new Error(`The endpoint "${urlPath}" does not exist`));
        }
      }
    });
  }
}