const { SERVER_PORT } = require('../constants');

describe('server', () => {
  let middleware = [];
  let server;
  let http;
  let https;
  let requestHandler;
  let listenPort;
  let listenCB;
  let readFileSync;
  
  function load() {
    jest.resetModules();
    
    server = { listen: jest.fn() };
    
    jest.doMock('http', () => ({
      createServer: jest.fn(() => server),
    }));
    http = require('http');
    
    jest.doMock('https', () => ({
      createServer: jest.fn(() => server),
    }));
    https = require('https');
    
    jest.doMock('fs', () => ({
      readFileSync: jest.fn(() => 'loadedFile'),
    }));
    readFileSync = require('fs').readFileSync;
    
    jest.doMock('./middleware', () => middleware);
    require('./middleware');

    require('./index');
    
    requestHandler = (process.env.NODE_EXTRA_CA_CERTS)
      ? https.createServer.mock.calls[0][0]
      : http.createServer.mock.calls[0][0];
    [listenPort, listenCB] = server.listen.mock.calls[0];
  }
  
  describe('requestHandler', () => {
    const urlPath = '/path/name';
    let req;
    let resp;
    
    beforeEach(() => {
      req = { url: `http://site.com${urlPath}` };
      resp = {};
    });
    
    it('should set up custom API', () => {
      load();
      requestHandler(req, resp);
      resp.preparingAsyncResponse();
      
      expect(resp.sendingAsyncResponse).toBe(true);
    });
    
    it('should run middleware against request', () => {
      middleware = [jest.fn(), jest.fn()];
      load();
      requestHandler(req, resp);
      
      middleware.forEach((m) => {
        expect(m).toHaveBeenCalledWith({ req, resp, urlPath });
      });
    });
    
    it.each([
      ['a response has already been sent', 'headersSent'],
      ['an async response is being prepared to send', 'sendingAsyncResponse'],
    ])('should stop running middleware if %s', (_, prop) => {
      middleware = [
        jest.fn(),
        jest.fn(({ resp: _resp }) => { _resp[prop] = true; }),
        jest.fn(),
      ];
      load();
      requestHandler(req, resp);
      
      expect(middleware[0]).toHaveBeenCalledWith({ req, resp, urlPath });
      expect(middleware[1]).toHaveBeenCalledWith({ req, resp, urlPath });
      expect(middleware[2]).not.toHaveBeenCalled();
    });
  });
  
  describe('https', () => {
    it('should create an HTTPS Server', () => {
      const certPath = '/path/to/some.crt';
      process.env.NODE_EXTRA_CA_CERTS = certPath;
      load();
      
      expect(readFileSync).toHaveBeenCalledWith(certPath, 'utf8');
      expect(readFileSync).toHaveBeenCalledWith(certPath.replace('.crt', '.key'), 'utf8');
      expect(https.createServer).toHaveBeenCalledWith(
        {
          cert: expect.any(String),
          key: expect.any(String),
        },
        expect.any(Function)
      );
      
      delete process.env.NODE_EXTRA_CA_CERTS;
    });
  });
  
  describe.each([
    ['', { protocol: 'http' }],
    [' on https', { protocol: 'https' }],
  ])('listen%s', (l, { protocol }) => {
    beforeEach(() => {
      if (protocol === 'https') process.env.NODE_EXTRA_CA_CERTS = '/some/path';
      load();
    });
    
    afterEach(() => {
      delete process.env.NODE_EXTRA_CA_CERTS;
    });
    
    it('should start the Server on the specified port', () => {
      expect(listenPort).toBe(SERVER_PORT);
    });
    
    it('should handle errors', () => {
      const err = new Error('ruh-roh');
      listenCB(err);
      
      expect(console.error).toHaveBeenCalledWith('[ERROR]', err);
    });
    
    it('should inform the User that the Server has started', () => {
      console.log = jest.fn();
      listenCB();
      
      expect(console.log).toHaveBeenCalledWith(`Server running at ${protocol}://localhost:${SERVER_PORT}`);
    });
  });
});
