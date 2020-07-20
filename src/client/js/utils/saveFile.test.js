describe('saveFile', () => {
  const OBJECT_URL = 'blob:null/a4e067ab-0d4d-4c60-a84a-0ad8d69ebc9f';
  let a;
  
  beforeEach(() => {
    jest.resetModules();
    delete window.utils;
    
    document.createElement = jest.fn(() => {
      a = {
        click: jest.fn(),
        remove: jest.fn(),
      };
      return a;
    });
    window.Blob = jest.fn(function B() { return  });
    window.URL.createObjectURL = jest.fn(() => OBJECT_URL);
  });
  
  it('should NOT create the utils namespace if it already exists', () => {
    window.utils = { fu: jest.fn() };
    require('./saveFile');
    expect(window.utils.fu).not.toBe(undefined);
  });
  
  it.each([
    ['options were', undefined],
    ['`data` was', { name: 'file-name', type: 'json' }],
    ['`name` was', { data: {}, type: 'json' }],
    ['`type` was', { data: {}, name: 'file-name' }],
  ])('should throw an error if %s NOT supplied', (l, opts) => {
    require('./saveFile');
    const _opts = opts || {};
    expect(() => { window.utils.saveFile(opts); }).toThrow(
      `You're missing a required param: data: "${_opts.data}" | name: "${_opts.name}" | type: "${_opts.type}"`
    );
  });
  
  it('should open a Save File dialog for the User', () => {
    require('./saveFile');
    const {
      FILE_TYPE__JSON,
      FILE_TYPE__TEXT,
    } = window.utils.saveFile;
    
    [
      FILE_TYPE__JSON,
      FILE_TYPE__TEXT,
    ].forEach((type) => {
      const data = JSON.stringify({ fu: 'bar' });
      const name = 'file-name';
      window.utils.saveFile({ data, name, type });
      
      expect(window.Blob).toHaveBeenCalledWith([data], { type });
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(a.href).toBe(OBJECT_URL);
      expect(a.download).toBe(name);
      expect(a.click).toHaveBeenCalled();
      expect(a.remove).toHaveBeenCalled();
    });
  });
});