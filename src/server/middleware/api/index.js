module.exports = function apiMiddleware({ req, resp, urlPath }) {
  if (urlPath.startsWith('/api')) {
    const returnErrorResp = require('../../utils/returnErrorResp');
    
    resp.preparingAsyncResponse();
    
    require('./loadAppConfig')(resp).then((appConfig) => {
      if (urlPath.endsWith('/config/create')) require('./createConfig')({ req, resp });
      else if (urlPath.endsWith('/user/create')) require('./createUser')({ appConfig, req, resp });
      else if (
        urlPath.endsWith('/user/creds/add')
        || urlPath.endsWith('/user/creds/update')
      ) require('./modifyCreds')({ appConfig, req, resp });
      else if (urlPath.endsWith('/user/creds/delete')) require('./deleteCreds')({ appConfig, req, resp });
      else if (urlPath.endsWith('/user/creds/import')) require('./importCreds')({ appConfig, req, resp });
      else if (urlPath.endsWith('/user/creds/load')) require('./loadCreds')({ appConfig, req, resp });
      else if (urlPath.endsWith('/user/delete')) require('./deleteUser')({ appConfig, req, resp });
      else if (urlPath.endsWith('/user/login')) require('./login')({ appConfig, req, resp });
      else if (urlPath.endsWith('/user/update')) require('./updateUser')({ appConfig, req, resp });
      else returnErrorResp({ label: 'Missing API path', resp })(new Error(`The endpoint "${urlPath}" does not exist`));
    });
  }
}