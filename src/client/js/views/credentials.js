(() => {
  window.showCredentials = function showCredentials() {
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
          ${window.templates.labeledInput({ label: 'Label', name: 'label', required: true })}
          ${window.templates.labeledInput({ label: 'Website', name: 'website' })}
          ${window.templates.labeledInput({ label: 'Email', name: 'email' })}
          ${window.templates.labeledInput({ label: 'Username', name: 'username' })}
          ${window.templates.labeledInput({ label: 'Password', name: 'password' })}
          <button type="button" id="addCustomCred">&#43; Add Custom</button>
          <button>Create</button>
        </form>
      `;
      
      credentialsDialog.show();
    });
  }
})();
