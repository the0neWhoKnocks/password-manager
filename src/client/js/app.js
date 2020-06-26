const loginForm = document.createElement('custom-login-form');
const createAccountForm = document.createElement('custom-create-account-form');

loginForm.show();
loginForm.onCreateClick = () => {
  loginForm.close();
  createAccountForm.show();
  createAccountForm.onCancelClick = () => {
    createAccountForm.close();
    loginForm.show();
  };
};
