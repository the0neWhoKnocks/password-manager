jest.mock('../../utils/returnErrorResp');
const returnErrorResp = require('../../utils/returnErrorResp');
jest.mock('./createConfig');
const createConfig = require('./createConfig');
jest.mock('./createUser');
const createUser = require('./createUser');
jest.mock('./deleteCreds');
const deleteCreds = require('./deleteCreds');
jest.mock('./deleteUser');
const deleteUser = require('./deleteUser');
jest.mock('./importCreds');
const importCreds = require('./importCreds');
jest.mock('./loadAppConfig');
const loadAppConfig = require('./loadAppConfig');
jest.mock('./loadCreds');
const loadCreds = require('./loadCreds');
jest.mock('./login');
const login = require('./login');
jest.mock('./modifyCreds');
const modifyCreds = require('./modifyCreds');
jest.mock('./updateUser');
const updateUser = require('./updateUser');

const middleware = require('./index');

const req = {};
const resp = { preparingAsyncResponse: jest.fn() };
let urlPath = '/';

describe('api', () => {
  beforeEach(() => {
    resp.preparingAsyncResponse.mockReset();
  });
  
  describe('skip middleware', () => {
    it('should NOT do anything', () => {
      middleware({ req, resp, urlPath });
      expect(resp.preparingAsyncResponse).not.toHaveBeenCalled();
    });
  });
  
  describe('run middleware', () => {
    const appConfig = { fu: 'bar' };
    let errorCB;
    
    beforeEach(() => {
      urlPath = '/api';
      loadAppConfig.mockReturnValue(Promise.resolve(appConfig));
      errorCB = jest.fn();
      returnErrorResp.mockReturnValue(errorCB);
    });
    
    it('should load the App config', async () => {
      await middleware({ req, resp, urlPath });
      expect(loadAppConfig).toHaveBeenCalledWith(resp);
    });
    
    it('should return an error if no API endpoint was found', async () => {
      await middleware({ req, resp, urlPath });
      expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Missing API path', resp });
      expect(errorCB).toHaveBeenCalledWith(expect.objectContaining({
        message: `The endpoint "${urlPath}" does not exist`,
      }));
    });
    
    it.each([
      ['/config/create', createConfig, { req, resp }],
      ['/user/create', createUser, { appConfig, req, resp }],
      ['/user/creds/add', modifyCreds, { appConfig, req, resp }],
      ['/user/creds/update', modifyCreds, { appConfig, req, resp }],
      ['/user/creds/delete', deleteCreds, { appConfig, req, resp }],
      ['/user/creds/import', importCreds, { appConfig, req, resp }],
      ['/user/creds/load', loadCreds, { appConfig, req, resp }],
      ['/user/delete', deleteUser, { appConfig, req, resp }],
      ['/user/login', login, { appConfig, req, resp }],
      ['/user/update', updateUser, { appConfig, req, resp }],
    ])('should handle the "%s" endpoint', async (urlSuffix, fn, fnArg) => {
      urlPath += urlSuffix;
      await middleware({ req, resp, urlPath });
      expect(fn).toHaveBeenCalledWith(fnArg);
    });
  });
});
