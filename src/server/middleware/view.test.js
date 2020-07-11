jest.mock('fs');
const { existsSync } = require('fs');
jest.mock('glob');
const glob = require('glob');
jest.mock('mkdirp');
const mkdirp = require('mkdirp');
jest.mock('../utils/returnErrorResp');
const returnErrorResp = require('../utils/returnErrorResp');
const log = jest.fn();
jest.mock('../utils/logger', () => ({
  logger: jest.fn(() => log),
}));

const {
  CONFIG_PATH,
  DATA_PATH,
  PUBLIC_JS,
} = require('../../constants');
const middleware = require('./view');

describe('view', () => {
  let resp;
  
  beforeEach(() => {
    resp = { end: jest.fn() };
    existsSync.mockReset();
    mkdirp.sync.mockReset();
  });
  
  describe('ensureFolderStructure', () => {
    it('should set up the required folder structure', async () => {
      existsSync.mockReturnValue(false);
      await middleware({ resp });
      
      expect(existsSync).toHaveBeenCalledWith(DATA_PATH);
      expect(mkdirp.sync).toHaveBeenCalledWith(DATA_PATH);
    });
    
    it('should NOT try to set up any folders', async () => {
      existsSync.mockReturnValue(true);
      await middleware({ resp });
      
      expect(mkdirp.sync).not.toHaveBeenCalled();
    });
  });
  
  describe('getJSFiles', () => {
    let globPath;
    let globOpts;
    let globCB;
    let errRespCB;
    
    beforeEach(() => {
      glob.mockImplementation((p, o, cb) => {
        globPath = p;
        globOpts = o;
        globCB = cb;
      });
      returnErrorResp.mockImplementation(() => {
        errRespCB = jest.fn();
        return errRespCB;
      });
    });
    
    it('should scan for JS files', async () => {
      existsSync.mockReturnValue(false);
      await middleware({ resp });
      
      expect(globPath).toBe('/**/*.js');
      expect(globOpts).toEqual({
        ignore: ['/**/app.js'],
        root: PUBLIC_JS,
      });
    });
    
    it('should handle glob errors', async (done) => {
      const err = 'ruh-roh';
      await middleware({ resp });
      globCB(err);
      
      process.nextTick(() => {
        expect(returnErrorResp).toHaveBeenCalledWith({ label: 'Failed to render view', resp });
        expect(errRespCB).toHaveBeenCalledWith(err);
        done();
      });
    });
    
    it('should return a cached list of JS file paths for the Browser', async (done) => {
      const jsFiles = ['/js/file1.jpg', '/js/file2.jpg'];
      
      await middleware({ resp });
      globCB(null, [
        `${PUBLIC_JS}/file1.jpg`,
        `${PUBLIC_JS}/file2.jpg`,
      ]);
      process.nextTick(async () => {
        expect(log).toHaveBeenCalledWith('[LOAD] JS files', `\n - ${jsFiles.join('\n - ')}`);
        
        glob.mockReset();
        await middleware({ resp });
        process.nextTick(() => {
          expect(glob).not.toHaveBeenCalled();
          done();
        });
      });
    });
    
    it('should return a current list of JS file paths while in dev env', async (done) => {
      let jsFiles = ['/js/file1.jpg', '/js/file2.jpg'];
      await middleware({ resp });
      globCB(null, [
        `${PUBLIC_JS}/file1.jpg`,
        `${PUBLIC_JS}/file2.jpg`,
      ]);
      process.nextTick(async () => {
        expect(log).toHaveBeenCalledWith('[LOAD] JS files', `\n - ${jsFiles.join('\n - ')}`);
        
        jsFiles = ['/js/file3.jpg', '/js/file4.jpg'];
        log.mockReset();
        await middleware({ resp });
        globCB(null, [
          `${PUBLIC_JS}/file3.jpg`,
          `${PUBLIC_JS}/file4.jpg`,
        ]);
        process.nextTick(() => {
          expect(log).toHaveBeenCalledWith('[LOAD] JS files', `\n - ${jsFiles.join('\n - ')}`);
          done();
        });
      });
    });
  });
  
  describe('page markup', () => {
    let markup;
    
    beforeEach(() => {
      middleware.jsFiles = ['/js/file3.jpg', '/js/file4.jpg'];
    });
    
    it('should add script tags for globbed JS files', async (done) => {
      await middleware({ resp });
      
      process.nextTick(() => {
        markup = resp.end.mock.calls[0][0];
        
        middleware.jsFiles.forEach((s) => {
          expect(markup.includes(`<script src="${s}"></script>`)).toBe(true);
        });
        
        done();
      });
    });
    
    it('should inform the App whether it needs to be set up or not', async (done) => {
      existsSync.mockReturnValue(false);
      await middleware({ resp });
      process.nextTick(async () => {
        markup = resp.end.mock.calls[0][0];
        expect(existsSync).toHaveBeenCalledWith(CONFIG_PATH);
        expect(markup.includes(`window.NEEDS_INITAL_SETUP = true;`)).toBe(true);
        
        existsSync.mockReturnValue(true);
        resp.end.mockReset();
        await middleware({ resp });
        process.nextTick(() => {
          markup = resp.end.mock.calls[0][0];
          expect(markup.includes(`window.NEEDS_INITAL_SETUP = false;`)).toBe(true);
          
          done();
        });
      });
    });
  });
});
