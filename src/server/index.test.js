const { SERVER_PORT } = require('../constants');

describe('server', () => {
  let middleware = [];
  let server;
  let http;
  let createServer;
  let listenPort;
  let listenCB;
  
  function load() {
    jest.resetModules();
    
    server = { listen: jest.fn() };
    
    jest.doMock('http', () => ({
      createServer: jest.fn(() => server),
    }));
    http = require('http');
    
    jest.doMock('./middleware', () => middleware);
    require('./middleware');

    require('./index');
    
    createServer = http.createServer.mock.calls[0][0];
    [listenPort, listenCB] = server.listen.mock.calls[0];
  }
  
  describe('createServer', () => {
    const urlPath = '/path/name';
    let req;
    let resp;
    
    beforeEach(() => {
      req = { url: `http://site.com${urlPath}` };
      resp = {};
    });
    
    it('should set up custom API', () => {
      load();
      createServer(req, resp);
      resp.preparingAsyncResponse();
      
      expect(resp.sendingAsyncResponse).toBe(true);
    });
    
    it('should run middleware against request', () => {
      middleware = [jest.fn(), jest.fn()];
      load();
      createServer(req, resp);
      
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
      createServer(req, resp);
      
      expect(middleware[0]).toHaveBeenCalledWith({ req, resp, urlPath });
      expect(middleware[1]).toHaveBeenCalledWith({ req, resp, urlPath });
      expect(middleware[2]).not.toHaveBeenCalled();
    });
  });
  
  describe('listen', () => {
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
      
      expect(console.log).toHaveBeenCalledWith(`Server running at http://localhost:${SERVER_PORT}`);
    });
  });
});
