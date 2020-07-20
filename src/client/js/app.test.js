describe('app', () => {
  beforeEach(() => {
    jest.resetModules();
    window.utils = { storage: { get: jest.fn() } };
    window.showConfigSetUp = jest.fn();
    window.showCredentials = jest.fn();
    window.showLogin = jest.fn();
  });
  
  afterEach(() => {
    delete window.NEEDS_INITAL_SETUP;
  });
  
  it('should display the "Config Set Up" View', () => {
    window.NEEDS_INITAL_SETUP = true;
    require('./app');
    expect(window.showConfigSetUp).toHaveBeenCalled();
  });
  
  it('should display the "Credentials" View', () => {
    window.utils.storage.get.mockReturnValue({});
    require('./app');
    expect(window.showCredentials).toHaveBeenCalled();
  });
  
  it('should display the "Log In" View', () => {
    require('./app');
    expect(window.showLogin).toHaveBeenCalled();
  });
});