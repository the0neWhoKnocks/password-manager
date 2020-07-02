const genUniqueId = (txt) => btoa(`cli_${txt}`).replace(/=/g, '');
const labeledInput = ({
  helpText = '',
  label,
  name,
  placeholder = '',
  required,
  type = 'text',
  value = '',
}) => {
  const id = genUniqueId(name);
  return `
    <div class="labeled-input">
      <div class="labeled-input__wrapper">
        <input
          type="${type}"
          id="${id}"
          name="${name}"
          placeholder="${placeholder}"
          value="${value}"
          ${required ? 'required' : ''}
        />
        <label for="${id}">${label}</label>
      </div>
      ${helpText && `<p class="help-text">${helpText}</p>`}
    </div>
  `;
};

function showConfigSetUp() {
  window.utils.storage.clear();
  
  const configDialog = document.createElement('custom-dialog');
  configDialog.modal = true;
  configDialog.innerHTML = `
    <form
      slot="dialogBody"
      id="createConfig"
      action="/api/config/create"
      method="POST"
      autocomplete="off"
    >
      <div class="hr-with-text">
        <span>Create Config</span>
      </div>
      <p>
        Looks like this is your first time running this App, so let's set
        some things up.
      </p>
      ${labeledInput({
        label: 'Cipher Key',
        name: 'cipherKey',
        placeholder: 'word or phrase',
        required: true,
        helpText: `
          The Cipher Key is a unique value used for some top-level
          encryption operations of the App.
        `, 
      })}
      ${labeledInput({
        label: 'Salt',
        name: 'salt',
        placeholder: 'word or phrase',
        required: true,
        helpText: `
          The Salt is a unique value that will be used to randomize
          encrypted values.
        `, 
      })}
      <button value="create">Create</button>
    </form>
  `;
  
  configDialog.show();
  
  configDialog.querySelector('#createConfig').addEventListener('submit', (ev) => {
    ev.preventDefault();
    
    const form = ev.currentTarget;
    
    window.utils.postData(form.action, form)
      .then(() => { window.location.reload(); })
      .catch(({ error }) => { alert(error); });
  });
}

function showLogin() {
  const doors = document.createElement('div');
  doors.classList.add('doors');
  document.body.appendChild(doors);
  
  const loginDialog = document.createElement('custom-dialog');
  loginDialog.modal = true;
  loginDialog.innerHTML = `
    <form
      slot="dialogBody"
      id="loginForm"
      method="POST"
      action="/api/user/login"
      autocomplete="off"
      spellcheck="false"
    >
      <div class="hr-with-text">
        <span>Log In</span>
      </div>
      ${labeledInput({ label: 'Username', name: 'username', required: true })}
      ${labeledInput({ label: 'Password', name: 'password', required: true, type: 'password' })}
      <label class="remember-me">
        <input type="checkbox" id="rememberMe" />
        Remember Me
      </label>
      <button value="login">Log In</button>
      <div class="hr-with-text">
        <span>or</span>
      </div>
      <button type="button" value="create">Create Account</button>
    </form>
  `;
  
  const createAccountDialog = document.createElement('custom-dialog');
  createAccountDialog.modal = true;
  createAccountDialog.innerHTML = `
    <form
      slot="dialogBody"
      id="createAccount"
      method="POST"
      action="/api/user/create"
      autocomplete="off"
      spellcheck="false"
    >
      <div class="hr-with-text">
        <span>Create Account</span>
      </div>
      ${labeledInput({ label: 'Username', name: 'username', required: true })}
      ${labeledInput({ label: 'Password', name: 'password', required: true, type: 'password' })}
      ${labeledInput({ label: 'Confirm Password', name: 'passwordConfirmed', required: true, type: 'password' })}
      <nav>
        <button type="button" value="cancel">Cancel</button>
        <button value="create">Create</button>
      </nav>
    </form>
  `;
  
  const openLoginDialog = () => {
    loginDialog.show();
    
    const loginForm = loginDialog.querySelector('form');
    const loginUsername = loginForm.querySelector('[name="username"]');
    const loginPassword = loginForm.querySelector('[name="password"]');
    const createAccountBtn = loginForm.querySelector('[value="create"]');
    const rememberMeCheckBox = loginForm.querySelector('#rememberMe');
    
    const handleCreateClick = () => {
      loginDialog.close();
      createAccountDialog.show();
      
      const createAccountForm = createAccountDialog.querySelector('form');
      const createUsername = createAccountForm.querySelector('[name="username"]');
      const createPassword = createAccountForm.querySelector('[name="password"]');
      const createPasswordConfirmed = createAccountForm.querySelector('[name="passwordConfirmed"]');
      const createCancel = createAccountForm.querySelector('[value="cancel"]');
      
      const handleCreateSubmit = (ev) => {
        ev.preventDefault();
        
        const form = ev.currentTarget;
        
        if (createPassword.value === createPasswordConfirmed.value) {
          window.utils.postData(form.action, form)
            .then(() => {
              createAccountDialog.close();
              openLoginDialog();
              loginUsername.value = createUsername.value;
              loginPassword.value = createPassword.value;
            })
            .catch(({ error }) => { alert(error); });
        }
        else {
          alert("Your passwords don't match");
        }
      }
      const handleCreateCancel = () => {
        createAccountDialog.close();
        openLoginDialog();
      };
      
      createAccountForm.addEventListener('submit', handleCreateSubmit);
      createCancel.addEventListener('click', handleCreateCancel);
      createAccountDialog.onClose = () => {
        createAccountForm.removeEventListener('submit', handleCreateSubmit);
        createCancel.removeEventListener('click', handleCreateCancel);
      };
    }
    const handleLogin = (ev) => {
      ev.preventDefault();
      
      const form = ev.currentTarget;
      
      window.utils.postData(form.action, form)
        .then((userData) => {
          loginDialog.close();
          window.utils.storage.set({ userData }, rememberMeCheckBox.checked);
        
          showCredentials();
          doors.classList.add('open');
        })
        .catch(({ error }) => { alert(error); });
    }
    
    createAccountBtn.addEventListener('click', handleCreateClick);
    loginForm.addEventListener('submit', handleLogin);
    loginDialog.onClose = () => {
      createAccountBtn.removeEventListener('click', handleCreateClick);
      loginForm.removeEventListener('submit', handleLogin);
    };
  };
  
  openLoginDialog();
}

function showCredentials() {
  const credentialsEl = document.createElement('div');
  credentialsEl.classList.add('credentials');
  credentialsEl.innerHTML = `
    <nav class="credentials__top-nav">
      <custom-drop-down label="Credentials">
        <button slot="ddItems" type="button" id="addCreds">Add</button>
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
  const addCredsBtn = document.querySelector('#addCreds');
  
  logoutBtn.addEventListener('click', () => {
    window.utils.storage.clear();
    window.location.reload();
  });
  addCredsBtn.addEventListener('click', () => {
    const credentialsDialog = document.createElement('custom-dialog');
    credentialsDialog.title = 'Add Credentials';
    credentialsDialog.innerHTML = `
      <form
        slot="dialogBody"
        id="addCredsForm"
        action="/api/user/add-creds"
        method="POST"
        autocomplete="off"
      >
        ${labeledInput({ label: 'Label', name: 'label', required: true })}
        ${labeledInput({ label: 'Website', name: 'website' })}
        ${labeledInput({ label: 'Email', name: 'email' })}
        ${labeledInput({ label: 'Username', name: 'username' })}
        ${labeledInput({ label: 'Password', name: 'password' })}
        <button type="button" id="addCustomCred">&#43; Add Custom</button>
        <button>Create</button>
      </form>
    `;
    
    credentialsDialog.show();
  });
}

if (window.NEEDS_INITAL_SETUP) showConfigSetUp();
else if (window.utils.storage.get('userData')) showCredentials();
else showLogin();
