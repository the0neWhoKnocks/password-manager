(() => {
  const templates = {
    credCard: ({
      label,
      ...creds
    }, ndx) => {
      const { customFields = {}, ...standardFields } = creds;
      const listItem = (obj, prop) => `
        <div class="credentials-card__list-item">
          <label>${prop}</label>
          <div>
            <button class="credentials-card__list-item-value">
              <span>${obj[prop]}</span>
              <div class="clipboard-icon">&#x1F4CB;</div>
            </button>
          </div>
        </div>
      `;
      
      return `
        <div class="credentials-card">
          <header class="credentials-card__label">${label}</header>
          <div class="credentials-card__list">
            ${Object.keys(standardFields).map((prop) => listItem(standardFields, prop)).join('')}
            ${Object.keys(customFields).map((prop) => listItem(customFields, prop)).join('')}
          </div>
          <nav class="credentials-card__ui">
            <button type="text" value="delete" data-ndx="${ndx}">Delete</button>
            <button type="text" value="edit" data-ndx="${ndx}">Edit</button>
          </nav>
        </div>
      `;
    },
    customFieldsCount: 0,
    customField: ({
      hiddenValue,
      label,
      value,
    }) => {
      templates.customFieldsCount += 1;
      return window.templates.labeledInput({
        hiddenValue,
        label,
        name: `customField_${templates.customFieldsCount}`,
        value,
      });
    },
    modifyCreds: (currentData = {}, ndx) => {
      const {
        customFields = {},
        email,
        label,
        password: credPassword,
        username: credUsername,
        website,
      } = currentData;
      const { password, username } = window.utils.storage.get('userData');
      const updating = !!Object.keys(currentData).length;
      const endpoint = (updating)
        ? '/api/user/creds/update'
        : '/api/user/creds/add';
      
      return `
        <div slot="dialogBody">
          <form
            class="creds-form"
            action="${endpoint}"
            method="POST"
            autocomplete="off"
          >
            <input type="hidden" name="user[username]" value="${username}" />
            <input type="hidden" name="user[password]" value="${password}" />
            ${updating ? `
              <input type="hidden" name="credsNdx" value="${ndx}" />
            ` : ''}
            <div class="creds-form__inputs">
              ${window.templates.labeledInput({ label: 'Label', name: 'label', value: label, required: true })}
              ${window.templates.labeledInput({ label: 'Password', name: 'password', value: credPassword, required: true })}
              ${window.templates.labeledInput({ label: 'Website', name: 'website', value: website })}
              ${window.templates.labeledInput({ label: 'Email', name: 'email', value: email })}
              ${window.templates.labeledInput({ label: 'Username', name: 'username', value: credUsername })}
              ${Object.keys(customFields).map((prop) => {
                return templates.customField({
                  hiddenValue: prop,
                  label: prop,
                  value: customFields[prop],
                });
              }).join('')}
            </div>
            <button ${updating ? 'disabled' : ''}>${(updating) ? 'Update' : 'Add'} Credentials</button>
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
      <div class="credentials__body is--loading">
        <div class="spinner"></div>
        <div class="no-creds-msg">
          No credentials present. Go to Credentials &gt; Add
        </div>
        <div>Search Bar</div>
        <div class="credentials__list"></div>
      </div>
    `,
  };
  
  let credentialsEl;
  let logoutBtn;
  let addCredsBtn;
  let credsBody;
  let credsList;
  let loadedCreds;
  
  function addValueToClipboard(el) {
    const temp = document.createElement('textarea');
    temp.style.cssText = 'position: absolute; top: -100px; left: -100px;';
    document.body.appendChild(temp);
    temp.value = el.querySelector('span').innerText;
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    
    const MODIFIER__COPIED = 'copied';
    if (!el.classList.contains(MODIFIER__COPIED)) {
      el.classList.add(MODIFIER__COPIED);
      const animDuration = window.utils.getCSSVar('--copiedMsgDuration', { toNumber: true });
      setTimeout(() => {
        el.classList.remove(MODIFIER__COPIED);
      }, animDuration);
    }
  }
  
  function handleCredCardClick(ev) {
    const currEl = ev.target;
    
    if (currEl.classList.contains('credentials-card__list-item-value')) {
      addValueToClipboard(currEl);
    }
    else if (currEl.nodeName === 'BUTTON') {
      if (currEl.value === 'edit') {
        const ndx = currEl.dataset.ndx;
        const dialog = createAddOrEditCredsDialog(loadedCreds[ndx], ndx);
        const form = dialog.querySelector('.creds-form');
        const loadedData = window.utils.serializeForm(form);
        const submitBtn = form.querySelector('button');
        
        let tO;
        form.addEventListener('input', () => {
          if (tO) clearTimeout(tO);
          tO = setTimeout(() => {
            if (JSON.stringify(loadedData) !== JSON.stringify(window.utils.serializeForm(form))) {
              submitBtn.removeAttribute('disabled');
            }
            else {
              submitBtn.setAttribute('disabled', '');
            }
          }, 300);
        });
      }
      else if (currEl.value === 'delete') {
        const ndx = currEl.dataset.ndx;
        const { username } = window.utils.storage.get('userData');
        const confirmDialog = document.createElement('custom-dialog');
        confirmDialog.modal = true;
        confirmDialog.innerHTML = `
          <form
            slot="dialogBody"
            class="delete-confirmation"
            method="POST"
            action="/api/user/creds/delete"
          >
            <input type="hidden" name="credsNdx" value="${ndx}" />
            <input type="hidden" name="username" value="${username}" />
            <p>
              Are you sure you want to delete <b>"${loadedCreds[ndx].label}"</b>?
            </p>
            <nav>
              <button type="button" value="no">No</button>
              <button>Yes</button>
            </nav>
          </form>
        `;
        
        confirmDialog.show();
        
        const form = confirmDialog.querySelector('form');
        const cancelBtn = confirmDialog.querySelector('[value="no"]');
        
        form.addEventListener('submit', (ev) => {
          ev.preventDefault();
          
          window.utils.postData(form.action, form)
            .then(() => {
              loadCredentials();
              confirmDialog.close();
            })
            .catch(({ error }) => { alert(error); });
        });
        cancelBtn.addEventListener('click', () => {
          confirmDialog.close();
        });
      }
    }
  }
  
  function renderCards(creds) {
    let credsListMarkup = '';
    creds.forEach((cred, ndx) => {
      credsListMarkup += templates.credCard(cred, ndx);
    });
    credsList.innerHTML = credsListMarkup;
    
    credsList.removeEventListener('click', handleCredCardClick);
    credsList.addEventListener('click', handleCredCardClick);
  }
  
  function loadCredentials() {
    window.utils.postData('/api/user/creds/load', { ...window.utils.storage.get('userData') })
      .then((creds) => {
        credsBody.classList.remove('is--loading');
        credsList.innerHTML = '';
        
        loadedCreds = creds;
        
        if (!creds.length) credsBody.classList.add('has--no-credentials');
        else renderCards(creds);
      })
      .catch(({ error }) => { alert(error); });
  }
  
  function createAddOrEditCredsDialog(currentData, ndx) {
    const credentialsDialog = document.createElement('custom-dialog');
    credentialsDialog.innerHTML = templates.modifyCreds(currentData, ndx);
    credentialsDialog.onClose = () => {
      templates.customFieldsCount = 0;
    };
    
    credentialsDialog.show();
    
    const credsForm = credentialsDialog.querySelector('.creds-form');
    const inputsContainer = credsForm.querySelector('.creds-form__inputs');
    const inputCreatorForm = credentialsDialog.querySelector('.input-creator-form');
    const addCustomCredBtn = inputCreatorForm.querySelector('#addCustomCred');
    const inputCreator = inputCreatorForm.querySelector('.input-creator');
    const cancelBtn = inputCreatorForm.querySelector('[value="cancel"]');
    const creatorInput = inputCreatorForm.querySelector('input');
    const MODIFIER__HIDDEN = 'is--hidden';
    
    inputCreator.classList.add(MODIFIER__HIDDEN);
    
    credsForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      
      window.utils.postData(credsForm.action, credsForm)
        .then(() => {
          credentialsDialog.close();
          loadCredentials();
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
      
      inputsContainer.insertAdjacentHTML(
        'beforeend',
        templates.customField({
          hiddenValue: creatorInput.value,
          label: creatorInput.value,
        })
      );
      creatorInput.value = '';
      creatorInput.focus();
    });
    
    return credentialsDialog;
  }
  
  window.showCredentials = function showCredentials() {
    credentialsEl = document.createElement('div');
    credentialsEl.classList.add('credentials');
    credentialsEl.innerHTML = templates.view();
    document.body.appendChild(credentialsEl);
    
    logoutBtn = document.querySelector('#logout');
    addCredsBtn = document.querySelector('#addCreds');
    credsBody = credentialsEl.querySelector('.credentials__body');
    credsList = credentialsEl.querySelector('.credentials__list');
    
    logoutBtn.addEventListener('click', () => {
      window.utils.storage.clear();
      window.location.reload();
    });
    addCredsBtn.addEventListener('click', () => {
      createAddOrEditCredsDialog();
    });
    
    loadCredentials();
  }
})();
