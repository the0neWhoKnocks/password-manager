(() => {
  const pad = (num, token='00') => token.substring(0, token.length-`${num}`.length) + num;
  const sortArrayByProp = (prop) => (a, b) => {
    const subCheck = (b[prop].toLowerCase() > a[prop].toLowerCase()) ? -1 : 0;
    return (a[prop].toLowerCase() > b[prop].toLowerCase()) ? 1 : subCheck;
  };
  const strForDataAttr = (str) => str.toLowerCase().replace(/(\s|_)/g, '-');
  const sanitizeStringForAttr = (str) => str
    .replace(/&/g, "&amp;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
  
  const queryParams = new URLSearchParams(location.search);
  const HIDE_VALUES = queryParams.get('hideValues') === 'true';
  
  const templates = {
    credCard: ({ _ndx, label, ...creds }) => {
      const { customFields = {}, ...standardFields } = creds;
      const listItem = (obj, prop) => `
        <button
          class="credentials-card__list-item"
          title="${sanitizeStringForAttr(`Click to copy "${prop}" value from "${label}"`)}"
        >
          <div class="credentials-card__list-item-column">
            <label>${prop}</label>
            <div class="credentials-card__list-item-value"><span>${obj[prop]}</span></div>
          </div>
          <div class="credentials-card__clipboard-icon">&#x1F4CB;</div>
        </button>
      `;
      
      return `
        <div class="credentials-card" data-card-label="${strForDataAttr(label)}">
          <header class="credentials-card__label">${label}</header>
          <div class="credentials-card__list">
            ${Object.keys(standardFields).map((prop) => listItem(standardFields, prop)).join('')}
            ${Object.keys(customFields).map((prop) => listItem(customFields, prop)).join('')}
          </div>
          <nav class="credentials-card__ui">
            <button type="text" value="delete" data-ndx="${_ndx}">Delete</button>
            <button type="text" value="edit" data-ndx="${_ndx}">Edit</button>
          </nav>
        </div>
      `;
    },
    customFieldsCount: 0,
    customField: ({ hiddenValue, label, value }) => {
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
              ${window.templates.labeledInput({ label: 'Email', name: 'email', type: 'email', value: email })}
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
      <div class="credentials ${HIDE_VALUES ? 'has--hidden-values' : ''}">
        <style id="filterStyles"></style>
        <nav class="credentials__top-nav">
          <custom-drop-down label="Credentials">
            <button slot="ddItems" type="button" id="addCreds">Add</button>
            <button slot="ddItems" type="button" id="exportCreds">Export</button>
            <button slot="ddItems" type="button" id="importCreds">Import</button>
          </custom-drop-down>
          <custom-drop-down label="User">
            <button slot="ddItems" type="button" id="deleteUser">Delete Account</button>
            <button slot="ddItems" type="button" id="updateUser">Update Account</button>
            <button slot="ddItems" type="button" id="logout">Log Out</button>
          </custom-drop-down>
        </nav>
        <div class="credentials__body">
          <div class="no-creds-msg">
            No credentials present. Go to Credentials &gt; Add
          </div>
          <div class="credentials__list">
            <input class="credentials__filter-input" type="text" placeholder="Filter by Label" />
            <div class="credentials__cards"></div>
          </div>
        </div>
        <div class="load-progress-indicator">
          <div class="load-progress-indicator__wrapper">
            <div class="load-progress-indicator__info"></div>
            <svg
              class="load-progress-indicator__progress-svg"
              viewbox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="50" class="is--path"></circle>
              <circle cx="50" cy="50" r="50" class="is--fill"></circle>
            </svg>
          </div>
        </div>
      </div>
    `,
  };
  
  let credentialsEl;
  let logoutBtn;
  let addCredsBtn;
  let exportCredsBtn;
  let importCredsBtn;
  let deleteUserBtn;
  let updateUserBtn;
  let credsBody;
  let credsList;
  let loadedCreds;
  let cardsEl;
  let filterStyles;
  
  function addValueToClipboard(el) {
    const temp = document.createElement('textarea');
    temp.style.cssText = 'position: absolute; top: -100px; left: -100px;';
    document.body.appendChild(temp);
    temp.value = el.querySelector('.credentials-card__list-item-value').textContent;
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
  
  const MODIFIER__LOADING = 'is--loading';
  function showProgressIndicator() {
    credentialsEl.classList.add(MODIFIER__LOADING);
  }
  function hideProgressIndicator() {
    credentialsEl.classList.remove(MODIFIER__LOADING);
  }
  
  function deleteConfirmationDialog({
    endpoint,
    hiddenInputs,
    msg,
    onSubmit,
  }) {
    const dialog = document.createElement('custom-dialog');
    dialog.modal = true;
    dialog.innerHTML = `
      <form
        slot="dialogBody"
        class="delete-confirmation"
        method="POST"
        action="${endpoint}"
      >
        ${hiddenInputs.map(({ name, value }) => `
          <input type="hidden" name="${name}" value="${value}" />
        `).join('')}
        <p class="delete-confirmation__msg">
          Are you sure you want to delete ${msg}?
        </p>
        <nav class="segmented-dialog-nav">
          <button type="button" value="no">No</button>
          <button>Yes</button>
        </nav>
      </form>
    `;
    
    dialog.show();
    
    const form = dialog.querySelector('form');
    const cancelBtn = dialog.querySelector('[value="no"]');
    
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      onSubmit({ dialog, form });
    });
    
    cancelBtn.addEventListener('click', () => {
      dialog.close();
    });
  }
  
  function debounceAndDiff({ form, submitBtn }) {
    const startData = window.utils.serializeForm(form);
    let tO;
    
    submitBtn.setAttribute('disabled', '');
    
    form.addEventListener('input', () => {
      if (tO) clearTimeout(tO);
      tO = setTimeout(() => {
        if (JSON.stringify(startData) !== JSON.stringify(window.utils.serializeForm(form))) {
          submitBtn.removeAttribute('disabled');
        }
        else {
          submitBtn.setAttribute('disabled', '');
        }
      }, 300);
    });
  }
  
  function handleCredCardClick(ev) {
    const currEl = ev.target;
    
    if (currEl.classList.contains('credentials-card__list-item')) {
      addValueToClipboard(currEl);
    }
    else if (currEl.nodeName === 'BUTTON') {
      if (currEl.value === 'edit') {
        const ndx = currEl.dataset.ndx;
        const dialog = createAddOrEditCredsDialog(loadedCreds[ndx], ndx);
        const form = dialog.querySelector('.creds-form');
        const submitBtn = form.querySelector('button');
        
        debounceAndDiff({ form, submitBtn });
      }
      else {
        const ndx = currEl.dataset.ndx;
        const { password, username } = window.utils.storage.get('userData');
        
        deleteConfirmationDialog({
          endpoint: '/api/user/creds/delete',
          hiddenInputs: [
            { name: 'credsNdx', value: ndx },
            { name: 'username', value: username },
            { name: 'password', value: password },
          ],
          msg: `<b>"${loadedCreds[ndx].label}"</b>`,
          onSubmit: ({ dialog, form }) => {
            window.utils.postData(form.action, form)
              .then(() => {
                loadedCreds.splice(ndx, 1);
                renderCards(loadedCreds);
                dialog.close();
              })
              .catch(({ error }) => { alert(error); });
          },
        });
      }
    }
  }
  
  function renderCards(creds) {
    const MODIFIER__LOADED = 'have--loaded';
    const MODIFIER__NO_CREDS = 'has--no-credentials';
    cardsEl.innerHTML = '';
    
    if (!creds.length) {
      credsBody.classList.add(MODIFIER__NO_CREDS);
      credsBody.classList.remove(MODIFIER__LOADED);
    }
    else {
      credsBody.classList.add(MODIFIER__LOADED);
      credsBody.classList.remove(MODIFIER__NO_CREDS);
      
      const sortedCreds = creds
        .map((cred, _ndx) => ({ ...cred, _ndx }))
        .sort(sortArrayByProp('label'));
      
      const letters = [];
      let credsListMarkup = '';
      sortedCreds.forEach((cred) => {
        const firstLetter = cred.label.toLowerCase().substring(0, 1);
        if (!letters.includes(firstLetter)) {
          letters.push(firstLetter);
            credsListMarkup += window.templates.hrWithText({
            className: 'credentials__letter-sep',
            label: firstLetter.toUpperCase(),
          });
        }
        
        credsListMarkup += templates.credCard(cred);
      });
      cardsEl.innerHTML = credsListMarkup;
      
      const filterInput = credsList.querySelector('.credentials__filter-input');
      
      cardsEl.removeEventListener('click', handleCredCardClick);
      cardsEl.addEventListener('click', handleCredCardClick);
      
      filterInput.addEventListener('input', (ev) => {
        const filter = ev.currentTarget.value;
        const filterRule = (filter !== '')
          ? `
            .credentials__letter-sep,
            .credentials-card:not([data-card-label*="${strForDataAttr(filter)}"]) {
              display: none;
            }
          `
          : '';
        filterStyles.textContent = filterRule;
      });
    }
  }
  
  function loadCredentials() {
    showProgressIndicator();
    
    window.utils.postData(
      '/api/user/creds/load',
      window.utils.storage.get('userData'),
    )
      .then(({ creds }) => {
        loadedCreds = creds;
        renderCards(loadedCreds);
        hideProgressIndicator();
      })
      .catch((err) => { alert(err.stack); });
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
      
      const formData = window.utils.serializeForm(credsForm);
      
      window.utils.postData(credsForm.action, formData)
        .then((credsData) => {
          const { credsNdx } = formData;
          
          if (credsNdx !== undefined) loadedCreds[credsNdx] = credsData;
          else loadedCreds.push(credsData);
          
          renderCards(loadedCreds);
          credentialsDialog.close();
        })
        .catch(({ error }) => { alert(error); });
    });
    addCustomCredBtn.addEventListener('click', () => {
      addCustomCredBtn.classList.add(MODIFIER__HIDDEN);
      inputCreator.classList.remove(MODIFIER__HIDDEN);
      inputCreator.querySelector('input').focus();
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
    document.body.insertAdjacentHTML('beforeend', templates.view());
    
    credentialsEl = document.querySelector('.credentials');
    logoutBtn = credentialsEl.querySelector('#logout');
    addCredsBtn = credentialsEl.querySelector('#addCreds');
    exportCredsBtn = credentialsEl.querySelector('#exportCreds');
    importCredsBtn = credentialsEl.querySelector('#importCreds');
    deleteUserBtn = credentialsEl.querySelector('#deleteUser');
    updateUserBtn = credentialsEl.querySelector('#updateUser');
    filterStyles = credentialsEl.querySelector('#filterStyles');
    // progressInfo = credentialsEl.querySelector('.load-progress-indicator__info');
    credsBody = credentialsEl.querySelector('.credentials__body');
    credsList = credentialsEl.querySelector('.credentials__list');
    cardsEl = credsList.querySelector('.credentials__cards');
    
    logoutBtn.addEventListener('click', () => {
      window.utils.storage.clear();
      window.location.reload();
    });
    
    addCredsBtn.addEventListener('click', () => {
      createAddOrEditCredsDialog();
    });
    
    exportCredsBtn.addEventListener('click', () => {
      const { username, password } = window.utils.storage.get('userData');
      const date = new Date();
      
      window.utils.saveFile({
        data: JSON.stringify({
          app: {
            schema: '1.0',
            user: { username, password },
          },  
          creds: loadedCreds,
        }, null, 2),
        name: `creds-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`,
        type: window.utils.saveFile.FILE_TYPE__JSON,
      });
    });
    
    importCredsBtn.addEventListener('click', () => {
      const { username, password } = window.utils.storage.get('userData');
      
      window.utils.loadFile({
        onFileAdd: () => {
          showProgressIndicator();
        },
      }).then((data) => {
        const payload = {
          creds: JSON.parse(data).creds,
          user: { username, password },
        };
        
        window.utils.postData(
          '/api/user/creds/import',
          payload,
        )
          .then(({ error }) => {
            if (error) alert(error);
            else loadCredentials();
          })
          .catch((err) => { alert(err.stack); });
      });
    });
    
    deleteUserBtn.addEventListener('click', () => {
      const { username } = window.utils.storage.get('userData');
      
      deleteConfirmationDialog({
        endpoint: '/api/user/delete',
        hiddenInputs: [
          { name: 'username', value: username },
        ],
        msg: 'your profile',
        onSubmit: ({ dialog, form }) => {
          window.utils.postData(form.action, form)
            .then(() => {
              window.utils.storage.clear();
              dialog.close();
              window.location.reload();
            })
            .catch(({ error }) => { alert(error); });
        },
      });
    });
    
    updateUserBtn.addEventListener('click', () => {
      const {
        username: currentUsername,
        password: currentPassword,
      } = window.utils.storage.get('userData');
      const dialog = document.createElement('custom-dialog');
      dialog.title = 'Update Account';
      dialog.innerHTML = `
        <form
          slot="dialogBody"
          class="update-user-form"
          action="/api/user/update"
          method="POST"
          autocomplete="off"
          spellcheck="false"
        >
          <input type="hidden" name="oldData[username]" value="${currentUsername}" />
          <input type="hidden" name="oldData[password]" value="${currentPassword}" />
          ${window.templates.labeledInput({ label: 'Username', name: 'newData[username]', value: currentUsername, required: true })}
          ${window.templates.labeledInput({ label: 'Password', name: 'newData[password]', value: currentPassword, required: true })}
          <nav class="segmented-dialog-nav">
            <button type="text" value="cancel">Cancel</button>
            <button value="update">Update</button>
          </nav>
        </form>
      `;
      
      dialog.show();
      
      const form = dialog.querySelector('form');
      const cancelBtn = form.querySelector('[value="cancel"]');
      
      debounceAndDiff({
        form,
        submitBtn: form.querySelector('[value="update"]'),
      });
      
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        
        window.utils.postData(form.action, form)
          .then(({ username, password }) => {
            window.utils.storage.set({ userData: { username, password } });
            loadCredentials();
            dialog.close();
          })
          .catch(({ error }) => { alert(error); });
      });
      cancelBtn.addEventListener('click', () => {
        dialog.close();
      });
    });
    
    loadCredentials();
  }
})();
