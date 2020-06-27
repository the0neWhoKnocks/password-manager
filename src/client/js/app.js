if (window.NEEDS_INITAL_SETUP) {
  const configForm = document.createElement('custom-create-config-form');
  configForm.action = '/api/config/create';
  configForm.show();
}
else {
  const loginForm = document.createElement('custom-login-form');
  const createAccountForm = document.createElement('custom-create-account-form');
  createAccountForm.action = '/api/user/create';
  
  loginForm.show();
  loginForm.onCreateClick = () => {
    loginForm.close();
    createAccountForm.show();
    createAccountForm.onCancelClick = () => {
      createAccountForm.close();
      loginForm.show();
    };
  };
}
