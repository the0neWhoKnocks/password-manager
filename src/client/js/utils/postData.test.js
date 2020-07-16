describe('postData', () => {
  const URL = '/api/v1/do-something';
  const payload = { fu: 'bar' };
  let fetchResolve;
  let xhrListeners;
  let xhrReq;
  
  beforeEach(() => {
    jest.resetModules();
    delete window.utils;
    
    window.fetch = jest.fn(() => new Promise((resolve) => {
      fetchResolve = (resp) => resolve(resp);
    }));
    
    xhrListeners = {};
    window.XMLHttpRequest = jest.fn(function XHR() {
      xhrReq = {
        addEventListener: jest.fn((ev, cb) => {
          xhrListeners[ev] = cb;
        }),
        open: jest.fn(),
        send: jest.fn(),
        setRequestHeader: jest.fn(),
      };
      return xhrReq;
    });
  });
  
  it('should NOT create the utils namespace if it already exists', () => {
    window.utils = { fu: jest.fn() };
    require('./postData');
    expect(window.utils.fu).not.toBe(undefined);
  });
  
  describe('normalize request data', () => {
    beforeEach(() => {
      require('./postData');
      window.utils.serializeForm = jest.fn(() => ({}));
    });
    
    it('should serialize a Forms data so it can be posted as JSON', () => {
      const form = document.createElement('form');
      window.utils.postData(URL, form);
      
      expect(window.utils.serializeForm).toHaveBeenCalledWith(form);
    });
    
    describe('postWithFetch', () => {
      let resp;
      
      beforeEach(() => {
        resp = {
          headers: { get: jest.fn() },
          json: jest.fn(),
          text: jest.fn(),
        };
      });
      
      it.each([
        ['parsed JSON', { contentType: 'application/json', ok: true, respData: { fiz: 'buzz' } }],
        ['text', { contentType: 'text/plain', ok: true, respData: 'just text' }],
        ['error data', { respData: 'Error' }],
      ])('should return %s', (l, { contentType = '', ok, respData }) => {
        if (contentType.includes('json')) resp.json.mockReturnValue(Promise.resolve(respData));
        else resp.text.mockReturnValue(Promise.resolve(respData));
        resp.headers.get.mockReturnValue(contentType);
        resp.ok = ok;
        const p = window.utils.postData(URL, payload);
        
        expect(window.fetch).toHaveBeenCalledWith(URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        fetchResolve(resp);
        
        if (ok) p.then((d) => { expect(d).toEqual(respData); });
        else p.catch((err) => { expect(err).toEqual(respData); });
      });
    });
    
    describe('postWithXHR', () => {
      let onProgress;
      let p;
      
      beforeEach(() => {
        onProgress = jest.fn();
        p = window.utils.postData(URL, payload, { onProgress });
      });
      
      it('should send request', () => {
        expect(xhrReq.addEventListener).toHaveBeenCalledWith('progress', xhrListeners.progress);
        expect(xhrReq.addEventListener).toHaveBeenCalledWith('load', xhrListeners.load);
        expect(xhrReq.addEventListener).toHaveBeenCalledWith('error', xhrListeners.error);
        expect(xhrReq.responseType).toBe('text');
        expect(xhrReq.open).toHaveBeenCalledWith('POST', URL);
        expect(xhrReq.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
        expect(xhrReq.send).toHaveBeenCalledWith(JSON.stringify(payload));
      });
      
      it('should handle progress', () => {
        xhrReq.response = 'line 1';
        xhrListeners.progress();
        expect(onProgress).toHaveBeenCalledWith(xhrReq.response);
        
        xhrReq.response += '\nline 2';
        xhrListeners.progress();
        expect(onProgress).toHaveBeenCalledWith(xhrReq.response);
      });
      
      it('should handle successful response', () => {
        xhrReq.response = 'line 1\nline 2';
        xhrListeners.load();
        p.then(resp => { expect(resp).toEqual(xhrReq.response); });
      });
      
      it('should handle failed response', () => {
        xhrReq.response = 'Error';
        xhrListeners.error();
        p.catch(resp => { expect(resp).toEqual(xhrReq.response); });
      });
    });
  });
});