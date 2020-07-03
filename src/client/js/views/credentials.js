(() => {
  const templates = {
    addCreds: () => {
      const { password, username } = window.utils.storage.get('userData');
      return `
        <div slot="dialogBody">
          <form
            class="add-creds-form"
            action="/api/user/add-creds"
            method="POST"
            autocomplete="off"
          >
            <input type="hidden" name="user[username]" value="${username}" />
            <input type="hidden" name="user[password]" value="${password}" />
            <div class="add-creds-form__inputs">
              ${window.templates.labeledInput({ label: 'Label', name: 'label', required: true })}
              ${window.templates.labeledInput({ label: 'Password', name: 'password', required: true })}
              ${window.templates.labeledInput({ label: 'Website', name: 'website' })}
              ${window.templates.labeledInput({ label: 'Email', name: 'email' })}
              ${window.templates.labeledInput({ label: 'Username', name: 'username' })}
            </div>
            <button>Add Credentials</button>
          </form>
          <form class="input-creator-form" autocomplete="off">
            <button type="button" id="addCustomCred">&#43; Add Custom Field</button>
            <div class="input-creator">
              <input type="text" placeholder="Custom Label" name="label" required />
              <nav>
                <button type="button" value="cancel">Close</button>
                <button value="confirm">Add Field</button>
              </nav>
            </div>
          </form>
        </div>
      `;
    },
    view: () => `
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
    `,
  };
  
  let credentialsEl;
  let logoutBtn;
  let addCredsBtn;
  let customFieldsCount = 0;
  
  window.showCredentials = function showCredentials() {
    credentialsEl = document.createElement('div');
    credentialsEl.classList.add('credentials');
    credentialsEl.innerHTML = templates.view();
    document.body.appendChild(credentialsEl);
    
    logoutBtn = document.querySelector('#logout');
    addCredsBtn = document.querySelector('#addCreds');
    
    logoutBtn.addEventListener('click', () => {
      window.utils.storage.clear();
      window.location.reload();
    });
    addCredsBtn.addEventListener('click', () => {
      const credentialsDialog = document.createElement('custom-dialog');
      credentialsDialog.innerHTML = templates.addCreds();
      credentialsDialog.onClose = () => {
        customFieldsCount = 0;
      };
      
      credentialsDialog.show();
      
      const addCredsForm = credentialsDialog.querySelector('.add-creds-form');
      const inputsContainer = addCredsForm.querySelector('.add-creds-form__inputs');
      const inputCreatorForm = credentialsDialog.querySelector('.input-creator-form');
      const addCustomCredBtn = inputCreatorForm.querySelector('#addCustomCred');
      const inputCreator = inputCreatorForm.querySelector('.input-creator');
      const cancelBtn = inputCreatorForm.querySelector('[value="cancel"]');
      const creatorInput = inputCreatorForm.querySelector('input');
      const MODIFIER__HIDDEN = 'is--hidden';
      
      inputCreator.classList.add(MODIFIER__HIDDEN);
      
      addCredsForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        
        window.utils.postData(addCredsForm.action, addCredsForm)
          .then(() => {
            credentialsDialog.close();
            
            // TODO - trigger re-load of creds
            alert('reload creds');
          })
          .catch(({ error }) => { alert(error); });
      });
      addCustomCredBtn.addEventListener('click', () => {
        addCustomCredBtn.classList.add(MODIFIER__HIDDEN);
        inputCreator.classList.remove(MODIFIER__HIDDEN);
      });
      cancelBtn.addEventListener('click', () => {
        addCustomCredBtn.classList.remove(MODIFIER__HIDDEN);
        inputCreator.classList.add(MODIFIER__HIDDEN);
      });
      inputCreatorForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        
        customFieldsCount += 1;
        inputsContainer.insertAdjacentHTML(
          'beforeend',
          window.templates.labeledInput({
            label: creatorInput.value,
            name: `customField_${customFieldsCount}`,
          })
        );
        creatorInput.value = '';
        creatorInput.focus();
      });
    });
  }
})();
