(() => {
  const {
    ROUTE__USER__CREDS__ADD,
    ROUTE__USER__CREDS__DELETE,
    ROUTE__USER__CREDS__IMPORT,
    ROUTE__USER__CREDS__LOAD,
    ROUTE__USER__CREDS__UPDATE,
    ROUTE__USER__DELETE,
    ROUTE__USER__UPDATE,
  } = window.api;
  
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
  
  const storage = {
    key: 'passman',
    get(prop) {
      const data = JSON.parse(localStorage.getItem(this.key) || '{}');
      return (prop) ? data[prop] : data;
    },
    set(data) {
      const currData = storage.get();
      localStorage.setItem(this.key, JSON.stringify({ ...currData, ...data }));
    },
  };
  
  const queryParams = new URLSearchParams(location.search);
  const sVals = storage.get();
  const hideValues = sVals.hideVals || queryParams.get('hideValues') === 'true';
  
  const templates = {
    credCard: ({ _ndx, label, ...creds }) => {
      const { customFields = {}, ...standardFields } = creds;
      const sFieldKeys = Object.keys(standardFields);
      const sFieldsOrder = [ // list of fields in `.creds-form__inputs`
        'username',
        'password',
        'email',
        'website',
      ];
      const listItem = (obj, prop) => {
        const baseAttrs = 'class="credentials-card__list-item"';
        const childMarkup = ({ valEl }) => `
          <div class="credentials-card__list-item-column">
            <label>${prop}</label>
            <div class="credentials-card__list-item-value">${valEl}</div>
          </div>
        `;
        
        switch (prop) {
          case 'website': return `
            <div ${baseAttrs}>
              ${childMarkup({ valEl: `<a href="${obj[prop]}">${obj[prop]}</a>` })}
            </div>
          `;
          default: return `
            <button
              ${baseAttrs}
              title="${sanitizeStringForAttr(`Click to copy "${prop}" value from "${label}"`)}"
            >
              ${childMarkup({ valEl: `<span>${obj[prop]}</span>` })}
              <div class="credentials-card__clipboard-icon">&#x1F4CB;</div>
            </button>
          `;
        }
      };
      
      return `
        <div class="credentials-card" data-card-label="${strForDataAttr(label)}">
          <header class="credentials-card__label">${label}</header>
          <div class="credentials-card__list">
            ${sFieldsOrder.filter((f) => sFieldKeys.includes(f)).map((prop) => listItem(standardFields, prop)).join('')}
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
        deletable: true,
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
        ? ROUTE__USER__CREDS__UPDATE
        : ROUTE__USER__CREDS__ADD;
      
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
              ${window.templates.labeledInput({ label: 'Username', name: 'username', value: credUsername })}
              ${window.templates.labeledInput({ label: 'Password', name: 'password', value: credPassword, required: true })}
              ${window.templates.labeledInput({ label: 'Email', name: 'email', type: 'email', value: email })}
              ${window.templates.labeledInput({ label: 'Website', name: 'website', value: website })}
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
      <div class="credentials">
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
            <div class="credentials__top-ui">
              <div class="credentials__filter-input-wrapper">
                <input class="credentials__filter-input" type="text" placeholder="Filter by Label" />
                <button class="credentials__clear-filter-btn" title="Clear Filter" disabled>
                  <svg class="svg-icon">
                    <use xlink:href="#delete" xmlns:xlink="http://www.w3.org/1999/xlink"></use>
                  </svg>
                </button>
              </div>
              <label class="credentials__hide-values-btn">
                <input id="hideVals" type="checkbox" name="hideValues" />
                Hide
              </label>
            </div>
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
  
  let addCredsBtn;
  let cardsEl;
  let clearFilterBtn;
  let credentialsEl;
  let credsBody;
  let credsList;
  let deleteUserBtn;
  let exportCredsBtn;
  let filterInput;
  let filterStyles;
  let hideVals;
  let importCredsBtn;
  let loadedCreds;
  let logoutBtn;
  let updateUserBtn;
  
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
    
    const diff = () => {
      if (JSON.stringify(startData) !== JSON.stringify(window.utils.serializeForm(form))) {
        submitBtn.removeAttribute('disabled');
      }
      else {
        submitBtn.setAttribute('disabled', '');
      }
    };
    
    submitBtn.setAttribute('disabled', '');
    
    form.addEventListener('input', () => {
      if (tO) clearTimeout(tO);
      tO = setTimeout(diff, 300);
    });
    
    const observer = new MutationObserver((mutationList) => {
      const itemRemoved = mutationList.find(({ removedNodes, type }) => type === 'childList' && removedNodes.length);
      if (itemRemoved) diff();
    });
    observer.observe(form, { subtree: true, childList: true });
  }
  
  function handleCredCardClick(ev) {
    const currEl = ev.target;
    
    if (currEl.nodeName === 'BUTTON') {
      if (currEl.classList.contains('credentials-card__list-item')) {
        addValueToClipboard(currEl);
      }
      else if (currEl.value === 'edit') {
        const ndx = currEl.dataset.ndx;
        const dialog = createAddOrEditCredsDialog(loadedCreds[ndx], ndx);
        const form = dialog.querySelector('.creds-form');
        const submitBtn = form.querySelector('button:not([type="button"])');
        
        debounceAndDiff({ form, submitBtn });
      }
      else {
        const ndx = currEl.dataset.ndx;
        const { password, username } = window.utils.storage.get('userData');
        
        deleteConfirmationDialog({
          endpoint: ROUTE__USER__CREDS__DELETE,
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
  
  async function loadCredentials() {
    showProgressIndicator();
    
    try {
      const { creds } = await window.utils.postData(
        ROUTE__USER__CREDS__LOAD,
        window.utils.storage.get('userData')
      );
      loadedCreds = creds;
      
      renderCards(loadedCreds);
      hideProgressIndicator();
      filterInput.focus();
    }
    catch (err) { alert(err.error || err.stack); }
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
    
    credsForm.addEventListener('click', ({ target }) => {
      if (target.value === 'deleteInput') {
        target.closest('.labeled-input').remove();
        templates.customFieldsCount = 0;
        
        [...credsForm.querySelectorAll('.labeled-input')].forEach((liEl) => {
          const cFs = [...liEl.querySelectorAll('[name*="customField_"]')];
          
          if (cFs.length) {
            templates.customFieldsCount += 1;
            
            cFs.forEach((el) => {
              el.name = el.name.replace(/customField_(\d+)/, `customField_${templates.customFieldsCount}`);
            });
          }
        });
      }
    });
    credsForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      
      try {
        const formData = window.utils.serializeForm(credsForm);
        const credsData = await window.utils.postData(credsForm.action, formData);
        const { credsNdx } = formData;
        
        if (credsNdx !== undefined) loadedCreds[credsNdx] = credsData;
        else loadedCreds.push(credsData);
        
        renderCards(loadedCreds);
        credentialsDialog.close();
      }
      catch (err) {
        alert(err.error || err.stack);
      }
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
  
  window.showCredentials = async function showCredentials() {
    document.body.insertAdjacentHTML('beforeend', templates.view());
    
    credentialsEl = document.querySelector('.credentials');
    logoutBtn = credentialsEl.querySelector('#logout');
    addCredsBtn = credentialsEl.querySelector('#addCreds');
    exportCredsBtn = credentialsEl.querySelector('#exportCreds');
    hideVals = credentialsEl.querySelector('#hideVals');
    importCredsBtn = credentialsEl.querySelector('#importCreds');
    deleteUserBtn = credentialsEl.querySelector('#deleteUser');
    updateUserBtn = credentialsEl.querySelector('#updateUser');
    filterStyles = credentialsEl.querySelector('#filterStyles');
    // progressInfo = credentialsEl.querySelector('.load-progress-indicator__info');
    credsBody = credentialsEl.querySelector('.credentials__body');
    credsList = credentialsEl.querySelector('.credentials__list');
    cardsEl = credsList.querySelector('.credentials__cards');
    filterInput = credsList.querySelector('.credentials__filter-input');
    clearFilterBtn = credsList.querySelector('.credentials__clear-filter-btn');
    
    logoutBtn.addEventListener('click', () => {
      window.utils.storage.clear();
      window.location.reload();
    });
    
    addCredsBtn.addEventListener('click', () => {
      createAddOrEditCredsDialog();
    });
    
    filterInput.addEventListener('input', (ev) => {
      clearFilterBtn.disabled = ev.target.value === '';
    });
    clearFilterBtn.addEventListener('click', () => {
      filterInput.value = '';
      filterInput.dispatchEvent(new Event('input'));
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
    
    hideVals.addEventListener('change', ({ currentTarget: { checked } }) => {
      storage.set({ hideVals: checked });
      
      if (checked) { credentialsEl.classList.add('has--hidden-values'); }
      else { credentialsEl.classList.remove('has--hidden-values'); }
    });
    if (hideValues) {
      hideVals.click();
    }
    
    importCredsBtn.addEventListener('click', async () => {
      try {
        const { username, password } = window.utils.storage.get('userData');
        const loadedData = await window.utils.loadFile({
          onFileAdd: showProgressIndicator,
        });
        
        if (loadedData) {
          await window.utils.postData(ROUTE__USER__CREDS__IMPORT, {
            creds: JSON.parse(loadedData).creds,
            user: { username, password },
          });
          
          await loadCredentials();
        }
      }
      catch (err) {
        const _err = err.error || err.stack;
        alert(_err);
        hideProgressIndicator();
      }
    });
    
    deleteUserBtn.addEventListener('click', () => {
      const { username } = window.utils.storage.get('userData');
      
      deleteConfirmationDialog({
        endpoint: ROUTE__USER__DELETE,
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
    
    updateUserBtn.addEventListener('click', async () => {
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
          action="${ROUTE__USER__UPDATE}"
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
      
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        
        try {
          const { username, password } = await window.utils.postData(form.action, form);
          
          window.utils.storage.set({ userData: { username, password } });
          await loadCredentials();
          dialog.close();
        }
        catch (err) {
          alert(err.error || err.stack);
        }
      });
      cancelBtn.addEventListener('click', () => {
        dialog.close();
      });
    });
    
    await loadCredentials();
  }
})();
