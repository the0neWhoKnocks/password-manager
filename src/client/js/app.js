function showConfigSetUp() {
  const configForm = document.createElement('custom-create-config-form');
  configForm.action = '/api/config/create';
  configForm.show();
}

function showLogin() {
  const doors = document.createElement('div');
  doors.classList.add('doors');
  document.body.appendChild(doors);
  
  const loginForm = document.createElement('custom-login-form');
  loginForm.action = '/api/user/login';
  loginForm.onCreateClick = () => {
    loginForm.close();
    createAccountForm.show();
  };
  loginForm.onLoginSuccess = (userData) => {
    loginForm.close();
    window.utils.storage.set({ userData }, loginForm.rememberMe);
    
    showCredentials();
    doors.classList.add('open');
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
  const credentialsEl = document.createElement('div');
  credentialsEl.classList.add('credentials');
  credentialsEl.innerHTML = `
    <nav class="credentials__top-nav">
      <custom-drop-down label="Credentials">
        <button slot="ddItems" type="button">Add</button>
        <button slot="ddItems" type="button">Export</button>
        <button slot="ddItems" type="button">Import</button>
      </custom-drop-down>
      <custom-drop-down label="User">
        <button slot="ddItems" type="button">Delete Account</button>
        <button slot="ddItems" type="button" id="logout">Log Out</button>
      </custom-drop-down>
    </nav>
    <div class="credentials__body"></div>
  `;
  document.body.appendChild(credentialsEl);
  
  const logoutBtn = document.querySelector('#logout');
  
  logoutBtn.addEventListener('click', () => {
    window.utils.storage.clear();
    window.location.reload();
  });
}

if (window.NEEDS_INITAL_SETUP) showConfigSetUp();
else if (window.utils.storage.get('userData')) showCredentials();
else showLogin();
