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
    window.utils.storage.set({ userData }, loginForm.rememberMe);
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
else if (window.utils.storage.get('userData')) showCredentials();
else showLogin();
