const parseReq = require('./parseReq');

describe('parseReq', () => {
  let req;
  let dataCB;
  let endCB;
  
  beforeEach(() => {
    req = {
      on: jest.fn((arg, cb) => {
        switch (arg) {
          case 'data': dataCB = cb; break;
          case 'end': endCB = cb; break;
        }
      }),
    };
  });
  
  it('should NOT parse request', async () => {
    req.method = 'GET';
    parseReq(req).then(() => {
      expect(req.on).not.toHaveBeenCalled();
    });
  });
  
  it.each([
    'DELETE',
    'POST',
  ])('should parse %s requests', async (method) => {
    req.method = method;
    parseReq(req).then(() => {
      expect(req.on).toHaveBeenCalledWith('data');
      expect(req.on).toHaveBeenCalledWith('end');
    });
  });
  
  it('should return JSON data', async () => {
    req.method = 'POST';
    parseReq(req).then((json) => {
      expect(json).toEqual({ fu: 'bar' });
    });
    dataCB('{\n');
    dataCB('  "fu": "bar"\n');
    dataCB('}\n');
    endCB();
  });
  
  it('should handle bad JSON data', async () => {
    req.method = 'POST';
    parseReq(req).catch((err) => {
      expect(err.message.includes('Unexpected token f in JSON')).toBe(true);
    });
    dataCB('{\n');
    dataCB('  fu: "bar"\n');
    dataCB('}\n');
    endCB();
  });
});
