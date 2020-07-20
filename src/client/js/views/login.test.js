require('../templates/hrWithText');
require('../templates/labeledInput');
require('../wcs/CustomDialog');
require('./login');

jest.useFakeTimers();

describe('login', () => {
  const createErr = 'failed create';
  const loginErr = 'failed login';
  const userData = { username: 'John', password: 'seecret' };
  let createSuccessful = true;
  let loginSuccessful = true;
  let loginDialog;
  let loginForm;
  let rememberMe;
  let doors;
  
  beforeEach(() => {
    [...document.querySelectorAll('custom-dialog')].forEach((el) => {
      el.close();
    });
    
    window.utils = {
      postData: jest.fn((url) => {
        let ret;
        
        if (url.endsWith('login')) {
          ret = (loginSuccessful) ? Promise.resolve(userData) : Promise.reject({ error: loginErr });
        }
        else if (url.endsWith('create')) {
          ret = (createSuccessful) ? Promise.resolve() : Promise.reject({ error: createErr });
        }
        
        return ret;
      }),
      storage: {
        set: jest.fn()
      },
    };
    
    window.showCredentials = jest.fn();
    
    window.showLogin();
    loginDialog = document.querySelector('custom-dialog');
    loginForm = loginDialog.querySelector('#loginForm');
    rememberMe = loginForm.querySelector('#rememberMe');
    doors = document.querySelector('.doors');
  });
  
  it('should display the Login Dialog', () => {
    expect(loginForm.action.endsWith('/api/user/login')).toBe(true);
    expect(loginForm.method).toBe('post');
    expect(loginForm.getAttribute('autocomplete')).toBe('off');
    expect(loginForm.getAttribute('spellcheck')).toBe('false');
    
    const labeledInputs = [...loginForm.querySelectorAll('.labeled-input')];
    const input1 = labeledInputs[0].querySelector('input');
    const label1 = labeledInputs[0].querySelector('label');
    expect(input1.name).toBe('username');
    expect(input1.required).toBe(true);
    expect(label1.textContent).toBe('Username');
    expect(label1.getAttribute('for')).toBe(input1.id);
    const input2 = labeledInputs[1].querySelector('input');
    const label2 = labeledInputs[1].querySelector('label');
    expect(input2.name).toBe('password');
    expect(input2.required).toBe(true);
    expect(input2.type).toBe('password');
    expect(label2.textContent).toBe('Password');
    expect(label2.getAttribute('for')).toBe(input2.id);
    expect(rememberMe.checked).toBe(false);
  });
  
  describe('submits login data', () => {
    let submitBtn;
    
    beforeEach(() => {
      submitBtn = loginForm.querySelector('[value="login"]');
    });
    
    it('should handle successful submission of data', (done) => {
      const closeSpy = jest.spyOn(loginDialog, 'close');
      rememberMe.click();
      submitBtn.click();
  
      process.nextTick(() => {
        jest.runAllTimers();
        
        expect(window.utils.postData).toHaveBeenCalledWith(loginForm.action, loginForm);
        expect(closeSpy).toHaveBeenCalled();
        expect(window.utils.storage.set).toHaveBeenCalledWith({ userData }, true);
        expect(window.showCredentials).toHaveBeenCalled();
        expect(doors.classList.contains('open')).toBe(true);
        
        done();
      });
    });
  
    it('should handle a failed submission of data', (done) => {
      loginSuccessful = false;
      submitBtn.click();
    
      process.nextTick(() => {
        expect(window.alert).toHaveBeenCalledWith(loginErr);
        done();
      });
    });
  });
  
  describe('Create User', () => {
    let createDialog;
    let createForm;
    let submitBtn;
    let cancelBtn;
    
    beforeEach(() => {
      loginForm.querySelector('[value="create"]').click();
      jest.runAllTimers();
      
      createDialog = [...document.querySelectorAll('custom-dialog')][1];
      createForm = createDialog.querySelector('#createAccount');
      submitBtn = createForm.querySelector('[value="create"]');
      cancelBtn = createForm.querySelector('[value="cancel"]');
    });
    
    it('should display the Create User Dialog', () => {
      expect(createForm.action.endsWith('/api/user/create')).toBe(true);
      expect(createForm.method).toBe('post');
      expect(createForm.getAttribute('autocomplete')).toBe('off');
      expect(createForm.getAttribute('spellcheck')).toBe('false');
      
      const labeledInputs = [...createForm.querySelectorAll('.labeled-input')];
      const input1 = labeledInputs[0].querySelector('input');
      const label1 = labeledInputs[0].querySelector('label');
      expect(input1.name).toBe('username');
      expect(input1.required).toBe(true);
      expect(label1.textContent).toBe('Username');
      expect(label1.getAttribute('for')).toBe(input1.id);
      const input2 = labeledInputs[1].querySelector('input');
      const label2 = labeledInputs[1].querySelector('label');
      expect(input2.name).toBe('password');
      expect(input2.required).toBe(true);
      expect(input2.type).toBe('password');
      expect(label2.textContent).toBe('Password');
      expect(label2.getAttribute('for')).toBe(input2.id);
      const input3 = labeledInputs[2].querySelector('input');
      const label3 = labeledInputs[2].querySelector('label');
      expect(input3.name).toBe('passwordConfirmed');
      expect(input3.required).toBe(true);
      expect(input3.type).toBe('password');
      expect(label3.textContent).toBe('Confirm Password');
      expect(label3.getAttribute('for')).toBe(input3.id);
    });
    
    it('should cancel out of the Create User Dialog', () => {
      const openLoginSpy = jest.spyOn(loginDialog, 'show');
      const closeCreateSpy = jest.spyOn(createDialog, 'close');
      cancelBtn.click();
      jest.runAllTimers();
      
      expect(closeCreateSpy).toHaveBeenCalled();
      expect(openLoginSpy).toHaveBeenCalled();
    });
    
    it('should handle successful submission of data', (done) => {
      const openLoginSpy = jest.spyOn(loginDialog, 'show');
      const closeCreateSpy = jest.spyOn(createDialog, 'close');
      const loginUsername = loginForm.querySelector('[name="username"]');
      const loginPassword = loginForm.querySelector('[name="password"]');
      const createdUsername = 'John';
      const createdPassword = 'seeeecret';
      createForm.querySelector('[name="username"]').value = createdUsername;
      createForm.querySelector('[name="password"]').value = createdPassword;
      createForm.querySelector('[name="passwordConfirmed"]').value = createdPassword;
      
      expect(loginUsername.value).toBe('');
      expect(loginPassword.value).toBe('');
      
      submitBtn.click();
  
      process.nextTick(() => {
        jest.runAllTimers();
        
        expect(window.utils.postData).toHaveBeenCalledWith(createForm.action, createForm);
        expect(closeCreateSpy).toHaveBeenCalled();
        expect(openLoginSpy).toHaveBeenCalled();
        expect(loginUsername.value).toBe(createdUsername);
        expect(loginPassword.value).toBe(createdPassword);
        
        done();
      });
    });
  
    it('should handle a failed submission of data', (done) => {
      createSuccessful = false;
      submitBtn.click();
    
      process.nextTick(() => {
        expect(window.alert).toHaveBeenCalledWith(createErr);
        done();
      });
    });
  
    it('should inform the user that they entered non-matching password values', () => {
      createForm.querySelector('[name="password"]').value = 'pass1';
      createForm.querySelector('[name="passwordConfirmed"]').value = 'pass2';
      submitBtn.click();
    
      expect(window.alert).toHaveBeenCalledWith("Your passwords don't match");
    });
  });
});