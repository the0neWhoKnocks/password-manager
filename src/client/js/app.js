if (window.NEEDS_INITAL_SETUP) {
  const configForm = document.createElement('custom-create-config-form');
  configForm.action = '/api/config/create';
  configForm.show();
}
else {
  const loginForm = document.createElement('custom-login-form');
  loginForm.action = '/api/user/login';
  loginForm.onCreateClick = () => {
    loginForm.close();
    createAccountForm.show();
  };
  loginForm.onLoginSuccess = (userData) => {
    loginForm.close();
    console.log(userData);
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
