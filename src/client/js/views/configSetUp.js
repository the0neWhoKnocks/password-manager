(() => {
  window.showConfigSetUp = function showConfigSetUp() {
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
        ${window.templates.hrWithText({ label: 'Create Config' })}
        <p>
          Looks like this is your first time running this App, so let's set
          some things up.
        </p>
        ${window.templates.labeledInput({
          label: 'Cipher Key',
          name: 'cipherKey',
          placeholder: 'word or phrase',
          required: true,
          helpText: `
            The Cipher Key is a unique value used for some top-level
            encryption operations of the App.
          `, 
        })}
        ${window.templates.labeledInput({
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
})();
