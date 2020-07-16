describe('loadFile', () => {
  const importedFile = '<Buffer >';
  const result = 'file contents';
  let fileInput;
  let inputEv;
  let inputEvType;
  let inputCB;
  let reader;
  let readerEv;
  let readerEvType;
  let readerCB;
  
  beforeEach(() => {
    jest.resetModules();
    delete window.utils;
    
    document.createElement = jest.fn(() => {
      fileInput = {
        addEventListener: jest.fn((ev, cb) => {
          inputEvType = ev;
          inputCB = cb;
        }),
        click: jest.fn(),
      };
      return fileInput
    });
    inputEv = { target: { files: [importedFile] } };
    
    window.FileReader = jest.fn(function FR() {
      reader = {
        addEventListener: jest.fn((ev, cb) => {
          readerEvType = ev;
          readerCB = cb;
        }),
        readAsText: jest.fn(),
      };
      return reader;
    });
    readerEv = { target: { result } };
  });
  
  it('should NOT create the utils namespace if it already exists', () => {
    window.utils = { fu: jest.fn() };
    require('./loadFile');
    expect(window.utils.fu).not.toBe(undefined);
  });
  
  it('should prompt the User to load a file from their file system', () => {
    require('./loadFile');
    window.utils.loadFile();
    
    expect(document.createElement).toHaveBeenCalledWith('input');
    expect(inputEvType).toBe('change');
    expect(fileInput.click).toHaveBeenCalled();
  });
  
  it('should start reading the file that the User chose', () => {
    require('./loadFile');
    window.utils.loadFile();
    inputCB(inputEv);
    
    expect(readerEvType).toBe('load');
    expect(reader.readAsText).toHaveBeenCalledWith(importedFile);
  });
  
  it('should trigger File Add handler', () => {
    require('./loadFile');
    const onFileAdd = jest.fn();
    window.utils.loadFile({ onFileAdd });
    inputCB(inputEv);
    
    expect(onFileAdd).toHaveBeenCalled();
  });
  
  it('should return the loaded file data', async () => {
    require('./loadFile');
    const promise = window.utils.loadFile();
    inputCB(inputEv);
    readerCB(readerEv);
    
    const content = await promise;
    expect(content).toBe(result);
  });
});