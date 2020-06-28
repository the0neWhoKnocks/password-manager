const storage = {
  key: 'pass_man',
  get: function getStorageData(prop) {
    let data;
    let storageType;
    
    if (window.sessionStorage[this.key]) storageType = 'sessionStorage';
    else if (window.localStorage[this.key]) storageType = 'localStorage';
    
    if (storageType) {
      data = JSON.parse(window[storageType].getItem(this.key));
      if (prop) data = data[prop];
    }
    
    return data;
  },
  set: function setStorageData(data, useLocal) {
    let storageType;
    
    // ensure there's only ever one source of truth for data
    if (useLocal) {
      storageType = 'localStorage';
      window.sessionStorage.removeItem(this.key);
    }
    else {
      storageType = 'sessionStorage';
      window.localStorage.removeItem(this.key);
    }
    
    const currentData = window[storageType].getItem(this.key) || '{}';
    window[storageType].setItem(this.key, JSON.stringify({
      ...JSON.parse(currentData),
      ...data,
    }));
  },
};

function showConfigSetUp() {
  const configForm = document.createElement('custom-create-config-form');
  configForm.action = '/api/config/create';
  configForm.show();
}

function showLogin() {
  const loginForm = document.createElement('custom-login-form');
  loginForm.action = '/api/user/login';
  loginForm.onCreateClick = () => {
    loginForm.close();
    createAccountForm.show();
  };
  loginForm.onLoginSuccess = (userData) => {
    loginForm.close();
    storage.set({ userData }, loginForm.rememberMe);
  };
  
  const createAccountForm = document.createElement('custom-create-account-form');
  createAccountForm.action = '/api/user/create';
  createAccountForm.onCreateSuccess = ({ password, username }) => {
    createAccountForm.close();
    loginForm.show();
    loginForm.username = username;
    loginForm.password = password;
  };
  createAccountForm.onCancelClick = () => {
    createAccountForm.close();
    loginForm.show();
  };
  
  loginForm.show();
}

function showCredentials() {
  console.log('show creds');
}

if (window.NEEDS_INITAL_SETUP) showConfigSetUp();
else if (storage.get('userData')) showCredentials();
else showLogin();
