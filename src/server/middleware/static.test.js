jest.mock('fs');
const { readFile } = require('fs');
jest.mock('etag');
const etag = require('etag');

const { CLIENT_PATH } = require('../../constants');
const middleware = require('./static');

describe('static', () => {
  let req;
  let resp;
  let urlPath;
  
  beforeEach(() => {
    req = { headers: {} };
    resp = {
      end: jest.fn(),
      preparingAsyncResponse: jest.fn(),
      setHeader: jest.fn(),
    };
    urlPath = '/';
  });
  
  describe('skip middleware', () => {
    it.each([
      '/',
      '/css/',
      '/imgs/',
      '/js/',
    ])('should NOT run middleware for paths like "%s"', (p) => {
      middleware({ req, resp, urlPath: p });
      expect(resp.preparingAsyncResponse).not.toHaveBeenCalled();
    });
  });
  
  describe('run middleware', () => {
    const file = 'file contents';
    let filePath;
    let readFileCB;
    
    function runMiddleware() {
      readFile.mockReset();
      middleware({ req, resp, urlPath });
      [filePath, readFileCB] = readFile.mock.calls[0];
    }
    
    it.each([
      '/css/file.css',
      '/imgs/file.jpg',
      '/js/file.js',
    ])('should run middleware for paths like "%s"', (p) => {
      urlPath = p;
      runMiddleware();
      expect(resp.preparingAsyncResponse).toHaveBeenCalled();
      expect(filePath).toBe(`${CLIENT_PATH}${urlPath}`);
    });
    
    describe('read error', () => {
      const err = 'ruh-roh';
    
      it('should handle standard errors', () => {
        urlPath = '/imgs/file.jpg';
        runMiddleware();
        readFileCB(err, file);
        
        expect(resp.statusCode).toBe(500);
        expect(resp.statusMessage).toBe(err);
        expect(resp.end).toHaveBeenCalled();
      });
    
      it('should handle favicon errors', () => {
        urlPath = '/imgs/favicon.ico';
        runMiddleware();
        readFileCB(err, file);
        
        expect(console.error).toHaveBeenCalledWith('[ERROR]', err);
      });
    });
    
    describe('read success', () => {
      const tag = 'EJD987DFDF7987987DFDFSDDFDV';
      
      beforeEach(() => {
        etag.mockReset();
        resp.setHeader.mockReset();
        urlPath = '/imgs/file.jpg';
        etag.mockReturnValue(tag);
        runMiddleware();
      });
      
      it('should set default headers', () => {
        readFileCB(null, file);
        
        expect(resp.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      });
      
      it('should tell the Browser that the file has NOT changed', () => {
        req.headers['if-none-match'] = tag;
        readFileCB(null, file);
        
        expect(resp.statusCode).toBe(304);
        expect(resp.end).toHaveBeenCalledWith('');
      });
      
      it('should add caching headers', () => {
        readFileCB(null, file);
        
        expect(resp.setHeader).toHaveBeenCalledWith('ETag', tag);
        expect(resp.setHeader).toHaveBeenCalledWith('Cache-Control', `private, no-cache, max-age=${60 * 60 * 24 * 365}`);
        expect(resp.end).toHaveBeenCalledWith(file);
      });
    });
  });
});
