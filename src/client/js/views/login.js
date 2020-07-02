(() => {
  window.showLogin = function showLogin() {
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
        ${window.templates.labeledInput({ label: 'Username', name: 'username', required: true })}
        ${window.templates.labeledInput({ label: 'Password', name: 'password', required: true, type: 'password' })}
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
        ${window.templates.labeledInput({ label: 'Username', name: 'username', required: true })}
        ${window.templates.labeledInput({ label: 'Password', name: 'password', required: true, type: 'password' })}
        ${window.templates.labeledInput({ label: 'Confirm Password', name: 'passwordConfirmed', required: true, type: 'password' })}
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
          
            window.showCredentials();
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
})();
