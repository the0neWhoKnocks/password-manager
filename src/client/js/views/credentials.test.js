require('../templates/hrWithText');
require('../templates/labeledInput');
require('../utils/serializeForm');
require('../wcs/CustomDialog');
require('./credentials');

jest.useFakeTimers();

describe('credentials', () => {
  const addErr = 'failed add';
  const deleteErr = 'failed delete';
  const importErr = 'failed import';
  const loadErr = new Error('failed load');
  const updateErr = 'failed update';
  const username = 'John';
  const password = 'seeecret';
  const userData = { username, password };
  const clickEv = new Event('click', { bubbles: true, cancelable: true });
  const inputEv = new Event('input', { bubbles: true, cancelable: true });
  let creds;
  let credsResp;
  let addSuccessful = true;
  let deleteSuccessful = true;
  let updateSuccessful = true;
  let credentialsEl;
  let logoutBtn;
  let addCredsBtn;
  let exportCredsBtn;
  let importCredsBtn;
  let deleteUserBtn;
  let updateUserBtn;
  let filterStyles;
  let credsBody;
  let credsList;
  let postDataURL;
  let postDataPayload;
  let loadResolve;
  let loadReject;
  let importResolve;
  let importReject;
  
  const getLabeledInputs = (form) => {
    return [...form.querySelectorAll('.labeled-input')].map((el) => {
      let inputs = [...el.querySelectorAll('input')];
      let ret = { label: el.querySelector('label') };
      
      if (inputs.length > 1) ret.inputs = inputs;
      else ret.input = inputs[0];
      
      return ret;
    });
  };
  
  beforeEach(() => {
    creds = [
      {
        label: 'AAA',
        password: 'asdfwerasfd',
        customFields: { cust1: 'val1', cust2: 'val2' },
      },
      { label: 'PayPal', password: '87aysd8ftas' },
      { label: 'Pet Smart', password: 'iioioiwems' },
    ];
    credsResp = { creds };
    
    if (window.customDialog) {
      window.customDialog.close();
      jest.runAllTimers();
      [...document.querySelectorAll('custom-dialog')].forEach(el => el.remove());
    }
    
    window.utils.postData = jest.fn((url, payload) => {
      let ret;
      
      postDataURL = url;
      postDataPayload = payload;
      
      if (url.endsWith('add')) {
        ret = (addSuccessful) ? Promise.resolve(postDataPayload) : Promise.reject({ error: addErr });
      }
      else if (url.endsWith('delete')) {
        ret = (deleteSuccessful) ? Promise.resolve() : Promise.reject({ error: deleteErr });
      }
      else if (url.endsWith('import')) {
        ret = new Promise((resolve, reject) => {
          importResolve = resolve;
          importReject = reject;
        });
      }
      else if (url.endsWith('load')) {
        ret = new Promise((resolve, reject) => {
          loadResolve = resolve;
          loadReject = reject;
        });
      }
      else if (url.endsWith('update')) {
        const res = url.endsWith('user/update') ? userData : postDataPayload;
        ret = (updateSuccessful) ? Promise.resolve(res) : Promise.reject({ error: updateErr });
      }
      
      return ret;
    });
    
    window.utils.storage = {
      _data: {},
      clear: jest.fn(() => { window.utils.storage._data = {}; }),
      get: jest.fn(p => window.utils.storage._data[p]),
      set: jest.fn((p, d) => {
        const curr = window.utils.storage._data[p] || {};
        window.utils.storage._data[p] = { ...curr, ...d };
      }),
    };
    
    window.utils.storage.set('userData', userData);
    
    window.showCredentials();
    
    credentialsEl = document.querySelector('.credentials');
    logoutBtn = credentialsEl.querySelector('#logout');
    addCredsBtn = credentialsEl.querySelector('#addCreds');
    exportCredsBtn = credentialsEl.querySelector('#exportCreds');
    importCredsBtn = credentialsEl.querySelector('#importCreds');
    deleteUserBtn = credentialsEl.querySelector('#deleteUser');
    updateUserBtn = credentialsEl.querySelector('#updateUser');
    filterStyles = credentialsEl.querySelector('#filterStyles');
    credsBody = credentialsEl.querySelector('.credentials__body');
    credsList = credentialsEl.querySelector('.credentials__list');
  });
  
  it('should log the User out', () => {
    window.testCtx.location('reload', jest.fn());
    logoutBtn.click();
    expect(window.utils.storage.clear).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });
  
  describe('loadCredentials', () => {
    it('should display the Progress indicator', () => {
      expect(credentialsEl.classList.contains('is--loading')).toBe(true);
    });
    
    it('should handle successful submission of data', (done) => {
      expect(postDataURL).toBe('/api/user/creds/load');
      expect(postDataPayload).toEqual(userData);
      
      loadResolve({ creds: [] });
      
      process.nextTick(() => {
        expect(credentialsEl.classList.contains('is--loading')).toBe(false);
        done();
      });
    });
    
    it('should handle a failed submission of data', (done) => {
      loadReject(loadErr);
      process.nextTick(() => {
        expect(window.alert).toHaveBeenCalledWith(loadErr.stack);
        done();
      });
    });
    
    it('should inform the User that Creds need to be added', (done) => {
      loadResolve({ creds: [] });
      process.nextTick(() => {
        expect(credsBody.classList.contains('has--no-credentials')).toBe(true);
        expect(credsBody.classList.contains('have--loaded')).toBe(false);
        done();
      });
    });
    
    it('should only show the creds section when there are creds', (done) => {
      loadResolve(credsResp);
      process.nextTick(() => {
        expect(credsBody.classList.contains('has--no-credentials')).toBe(false);
        expect(credsBody.classList.contains('have--loaded')).toBe(true);
        done();
      });
    });
    
    it('should group cards by first label letter', (done) => {
      loadResolve(credsResp);
      process.nextTick(() => {
        const groupedSeps = [...document.querySelectorAll('.credentials__letter-sep')];
        expect(groupedSeps[0].textContent.trim()).toBe('A');
        expect(groupedSeps[1].textContent.trim()).toBe('P');
        
        done();
      });
    });
    
    it('should filter cards down', (done) => {
      loadResolve(credsResp);
      process.nextTick(() => {
        const filterInput = credsList.querySelector('.credentials__filter-input');
        
        filterInput.value = 'a';
        filterInput.dispatchEvent(inputEv);
        jest.runAllTimers();
        expect(filterStyles.textContent.includes(`[data-card-label*="${filterInput.value}"]`));
        
        filterInput.value = '';
        filterInput.dispatchEvent(inputEv);
        jest.runAllTimers();
        expect(filterStyles.textContent).toBe('');
        
        done();
      });
    });
    
    it('should copy a value to the clipboard', (done) => {
      loadResolve(credsResp);
      process.nextTick(() => {
        document.execCommand = jest.fn();
        window.utils.getCSSVar = jest.fn(() => 300);
        const item = document.querySelector('.credentials-card__list-item');
        item.click();
        item.click();
        
        expect(document.execCommand).toHaveBeenCalledWith('copy');
        expect(item.classList.contains('copied')).toBe(true);
        
        jest.runAllTimers();
        expect(item.classList.contains('copied')).toBe(false);
        
        done();
      });
    });
    
    it('should NOT do anything when clicking on non-UI parts of a Card', (done) => {
      loadResolve(credsResp);
      process.nextTick(() => {
        const card = document.querySelector('.credentials-card');
        const item = card.querySelector('.credentials-card__list-item');
        card.click();
        
        expect(item.classList.contains('copied')).toBe(false);
        
        done();
      });
    });
    
    it('should allow for clearing a fitler via a button click', (done) => {
      loadResolve(credsResp);
      process.nextTick(() => {
        const filterInput = credsList.querySelector('.credentials__filter-input');
        const clearFilterBtn = credsList.querySelector('.credentials__clear-filter-btn');
        
        expect(clearFilterBtn.disabled).toBe(true);
        
        filterInput.value = 'a';
        filterInput.dispatchEvent(inputEv);
        jest.runAllTimers();
        expect(clearFilterBtn.disabled).toBe(false);
        
        clearFilterBtn.dispatchEvent(clickEv);
        jest.runAllTimers();
        expect(filterInput.value).toBe('');
        expect(clearFilterBtn.disabled).toBe(true);
        
        done();
      });
    });
    
    describe('Delete Card', () => {
      let dialog;
      let deleteForm;
      let hiddenInputs;
      let btns;
      
      function openConfirmation() {
        loadResolve(credsResp);
        
        return new Promise((resolve) => {
          process.nextTick(() => {
            const cards = [...document.querySelectorAll('.credentials-card')];
            cards[0].querySelector('button[value="delete"]').click();
            
            jest.runAllTimers();
            dialog = window.customDialog;
            deleteForm = document.querySelector('.delete-confirmation');
            hiddenInputs = [...deleteForm.querySelectorAll('input[type="hidden"]')];
            btns = [...deleteForm.querySelectorAll('.segmented-dialog-nav button')];
            
            resolve();
          });
        });
      }
      
      it('should make the User confirm the deletion', (done) => {
        openConfirmation().then(() => {
          expect(dialog.modal).toBe(true);
          expect(deleteForm.method).toBe('post');
          expect(deleteForm.action.endsWith('/api/user/creds/delete')).toBe(true);
          expect(hiddenInputs[0].name).toBe('credsNdx');
          expect(hiddenInputs[0].value).toBe('0');
          expect(hiddenInputs[1].name).toBe('username');
          expect(hiddenInputs[1].value).toBe(username);
          
          done();
        });
      });
      
      it('should submit after confirmation', (done) => {
        openConfirmation().then(() => {
          expect(document.querySelectorAll('.credentials-card').length).toBe(3);
          
          btns[1].click();
          process.nextTick(() => {
            jest.runAllTimers();
            
            expect(document.querySelectorAll('.credentials-card').length).toBe(2);
            expect(window.customDialog).toBeUndefined();
        
            done();
          });
        });
      });
      
      it('should handle deletion failure', (done) => {
        openConfirmation().then(() => {
          deleteSuccessful = false;
          btns[1].click();
          process.nextTick(() => {
            jest.runAllTimers();
        
            expect(window.alert).toHaveBeenCalledWith(deleteErr);
        
            done();
          });
        });
      });
      
      it('should allow a User to cancel a deletion', (done) => {
        openConfirmation().then(() => {
          btns[0].click();
          process.nextTick(() => {
            jest.runAllTimers();
        
            expect(window.customDialog).toBeUndefined();
        
            done();
          });
        });
      });
    });
  });
  
  describe.each([
    ['Add', { dialogType: 'add' }],
    ['Update', { dialogType: 'update' }],
  ])('%s Creds', (dl, { dialogType }) => {
    const update = dialogType === 'update';
    let credentialsDialog;
    let credsForm;
    let inputCreatorForm;
    let hiddenInputs;
    let labeledInputs;
    let cards;
    let submitBtn;
    let addCustomCredBtn;
    let inputCreator;
    let creatorInput;
    let cancelBtn;
    let confirmBtn;
    
    function openDialog() {
      if (window.customDialog) {
        window.customDialog.close();
        jest.runAllTimers();
        [...document.querySelectorAll('custom-dialog')].forEach(el => el.remove());
      }
      
      return new Promise((resolve) => {
        if (update) {
          loadResolve(credsResp);
        }
        else {
          loadResolve({ creds });
          addCredsBtn.click();
        }
        
        process.nextTick(() => {
          if (update) {
            cards = [...document.querySelectorAll('.credentials-card')];
            cards[0].querySelector('button[value="edit"]').click();
          }
          
          credentialsDialog = document.querySelector('custom-dialog');
          credsForm = credentialsDialog.querySelector('.creds-form');
          hiddenInputs = [...credsForm.querySelectorAll('input[type="hidden"]')];
          labeledInputs = getLabeledInputs(credsForm);
          submitBtn = [...credsForm.querySelectorAll('button')].pop();
          
          inputCreatorForm = credentialsDialog.querySelector('.input-creator-form');
          addCustomCredBtn = inputCreatorForm.querySelector('#addCustomCred');
          inputCreator = inputCreatorForm.querySelector('.input-creator');
          creatorInput = inputCreatorForm.querySelector('input');
          cancelBtn = inputCreatorForm.querySelector('[value="cancel"]');
          confirmBtn = inputCreatorForm.querySelector('[value="confirm"]');
          
          resolve();
        });
      });
    }
    
    it(`should display the ${dl} Creds Dialog`, (done) => {
      openDialog().then(() => {
        if (update) expect(credsForm.action.endsWith('/api/user/creds/update')).toBe(true);
        else expect(credsForm.action.endsWith('/api/user/creds/add')).toBe(true);
        
        expect(credsForm.method).toBe('post');
        expect(credsForm.getAttribute('autocomplete')).toBe('off');
        expect(hiddenInputs[0].name).toBe('user[username]');
        expect(hiddenInputs[0].value).toBe(username);
        expect(hiddenInputs[1].name).toBe('user[password]');
        expect(hiddenInputs[1].value).toBe(password);
        
        if (update) {
          expect(hiddenInputs[2].name).toBe('credsNdx');
          expect(hiddenInputs[2].value).toBe('0');
        }
        else expect(hiddenInputs[2]).toBeUndefined();
        
        expect(labeledInputs[0].input.name).toBe('label');
        expect(labeledInputs[0].input.required).toBe(true);
        expect(labeledInputs[0].input.value).toBe(update ? creds[0].label : '');
        expect(labeledInputs[0].label.textContent).toBe('Label');
        expect(labeledInputs[0].label.getAttribute('for')).toBe(labeledInputs[0].input.id);
        
        expect(labeledInputs[1].input.name).toBe('password');
        expect(labeledInputs[1].input.required).toBe(true);
        expect(labeledInputs[1].input.value).toBe(update ? creds[0].password : '');
        expect(labeledInputs[1].label.textContent).toBe('Password');
        expect(labeledInputs[1].label.getAttribute('for')).toBe(labeledInputs[1].input.id);
        
        expect(labeledInputs[2].input.name).toBe('website');
        expect(labeledInputs[2].input.value).toBe('');
        expect(labeledInputs[2].label.textContent).toBe('Website');
        expect(labeledInputs[2].label.getAttribute('for')).toBe(labeledInputs[2].input.id);
        
        expect(labeledInputs[3].input.name).toBe('email');
        expect(labeledInputs[3].input.type).toBe('email');
        expect(labeledInputs[3].input.value).toBe('');
        expect(labeledInputs[3].label.textContent).toBe('Email');
        expect(labeledInputs[3].label.getAttribute('for')).toBe(labeledInputs[3].input.id);
        
        expect(labeledInputs[4].input.name).toBe('username');
        expect(labeledInputs[4].input.value).toBe('');
        expect(labeledInputs[4].label.textContent).toBe('Username');
        expect(labeledInputs[4].label.getAttribute('for')).toBe(labeledInputs[4].input.id);
        
        if (update) {
          expect(labeledInputs[5].inputs[0].name).toBe('customField_1_hidden');
          expect(labeledInputs[5].inputs[0].value).toBe('cust1');
          expect(labeledInputs[5].inputs[1].name).toBe('customField_1');
          expect(labeledInputs[5].inputs[1].value).toBe('val1');
          expect(labeledInputs[5].label.textContent).toBe('cust1');
          expect(labeledInputs[5].label.getAttribute('for')).toBe(labeledInputs[5].inputs[1].id);
          
          expect(labeledInputs[6].inputs[0].name).toBe('customField_2_hidden');
          expect(labeledInputs[6].inputs[0].value).toBe('cust2');
          expect(labeledInputs[6].inputs[1].name).toBe('customField_2');
          expect(labeledInputs[6].inputs[1].value).toBe('val2');
          expect(labeledInputs[6].label.textContent).toBe('cust2');
          expect(labeledInputs[6].label.getAttribute('for')).toBe(labeledInputs[6].inputs[1].id);
        }
        
        expect(submitBtn.disabled).toBe(update);
        expect(submitBtn.textContent).toBe(`${(update) ? 'Update' : 'Add'} Credentials`);
        
        expect(inputCreatorForm.getAttribute('autocomplete')).toBe('off');
        expect(creatorInput.name).toBe('label');
        expect(creatorInput.required).toBe(true);
        
        done();
      });
    });
    
    it(`should handle ${dl}ing data`, (done) => {
      openDialog().then(() => {
        let label;
        
        if (update) {
          const origValue = labeledInputs[0].input.value;
          
          expect(submitBtn.disabled).toBe(true);
          
          labeledInputs[0].input.value = `${origValue}iuwe`;
          labeledInputs[0].input.dispatchEvent(inputEv);
          jest.runAllTimers();
          expect(submitBtn.disabled).toBe(false);
          
          labeledInputs[0].input.value = origValue;
          labeledInputs[0].input.dispatchEvent(inputEv);
          jest.runAllTimers();
          expect(submitBtn.disabled).toBe(true);
          
          label = 'Updated Label';
          labeledInputs[0].input.value = label;
          labeledInputs[0].input.dispatchEvent(inputEv);
          jest.runAllTimers();
          expect(submitBtn.disabled).toBe(false);
        }
        else {
          label = 'Label';
          labeledInputs[0].input.value = label;
        }
        
        submitBtn.click();
        expect(postDataURL.endsWith(`/api/user/creds/${update ? 'update' : 'add'}`)).toBe(true);
        expect(postDataPayload).toEqual(expect.objectContaining({ label }));
        
        process.nextTick(() => {
          jest.runAllTimers();
          expect(window.customDialog).toBeUndefined();
          done();
        });
      });
    });
    
    it(`should handle a failure during an ${dl}`, (done) => {
      let err;
      
      openDialog().then(() => {
        if (update) {
          labeledInputs[0].input.value = 'Updated Label';
          labeledInputs[0].input.dispatchEvent(inputEv);
          jest.runAllTimers();
          updateSuccessful = false;
          err = updateErr;
        }
        else {
          labeledInputs[0].input.value = 'Label';
          addSuccessful = false;
          err = addErr;
        }
        
        submitBtn.click();
        
        process.nextTick(() => {
          expect(window.alert).toHaveBeenCalledWith(err);
          done();
        });
      });
    });
    
    it('should display the Input Creator', (done) => {
      openDialog().then(() => {
        expect(inputCreator.classList.contains('is--hidden')).toBe(true);
        
        addCustomCredBtn.click();
        
        expect(addCustomCredBtn.classList.contains('is--hidden')).toBe(true);
        expect(inputCreator.classList.contains('is--hidden')).toBe(false);
        expect(document.activeElement).toBe(inputCreator.querySelector('input'));
        
        done();
      });
    });
    
    it('should cancel creating a Custom Input', (done) => {
      openDialog().then(() => {
        addCustomCredBtn.click();
        
        expect(addCustomCredBtn.classList.contains('is--hidden')).toBe(true);
        expect(inputCreator.classList.contains('is--hidden')).toBe(false);
        
        cancelBtn.click();
        
        expect(addCustomCredBtn.classList.contains('is--hidden')).toBe(false);
        expect(inputCreator.classList.contains('is--hidden')).toBe(true);
        
        done();
      });
    });
    
    it('should create a Custom Input', (done) => {
      openDialog().then(() => {
        const label = 'Custom Label';
        const custNdx = update ? '3' : '1';
        addCustomCredBtn.click();
        creatorInput.value = label;
        confirmBtn.click();
        
        const customInput = getLabeledInputs(credsForm).pop();
        expect(customInput.inputs[0].name).toBe(`customField_${custNdx}_hidden`);
        expect(customInput.inputs[0].value).toBe(label);
        expect(customInput.inputs[1].name).toBe(`customField_${custNdx}`);
        expect(customInput.inputs[1].value).toBe('');
        expect(customInput.label.textContent).toBe(label);
        expect(customInput.label.getAttribute('for')).toBe(customInput.inputs[1].id);
        
        done();
      });
    });
  });
  
  describe('Export Creds', () => {
    it('should prompt the User to save the exported data', () => {
      window.utils.saveFile = jest.fn(function sF() {});
      window.utils.saveFile.FILE_TYPE__JSON = 'json';
      const year = 2020;
      const month = 0;
      const day = 2;
      window.Date = jest.fn(function D() {
        return {
          getFullYear: jest.fn(() => year),
          getMonth: jest.fn(() => month),
          getDate: jest.fn(() => day),
        };
      });
      exportCredsBtn.click();
      
      expect(window.utils.saveFile).toHaveBeenCalledWith({
        data: JSON.stringify({
          app: {
            schema: '1.0',
            user: { username, password },
          },
          creds,
        }, null, 2),
        name: `creds-backup-${year}-0${1}-0${day}.json`,
        type: window.utils.saveFile.FILE_TYPE__JSON,
      });
    });
  });
  
  describe('Import Creds', () => {
    it('should display import progress after the User has picked a file to import', (done) => {
      let onFileAdd;
      window.utils.loadFile = jest.fn((opts) => {
        onFileAdd = opts.onFileAdd;
        return Promise.resolve(JSON.stringify({ creds }));
      });
      importCredsBtn.click();
      onFileAdd();
      
      process.nextTick(() => {
        expect(window.utils.loadFile).toHaveBeenCalledWith({ onFileAdd });
        expect(credentialsEl.classList.contains('is--loading')).toBe(true);
        expect(postDataURL).toBe('/api/user/creds/import');
        expect(postDataPayload).toEqual({ creds, user: userData });
        
        done();
      });
    });
    
    it('should handle a successful import', (done) => {
      importResolve(JSON.stringify({}));
      importCredsBtn.click();
      process.nextTick(() => {
        expect(credentialsEl.classList.contains('is--loading')).toBe(true);
        done();
      });
    });
    
    it('should handle an error within a successful import', (done) => {
      const error = 'ruh-roh';
      importResolve({ error });
      importCredsBtn.click();
      process.nextTick(() => {
        expect(window.alert).toHaveBeenCalledWith(error);
        done();
      });
    });
    
    it('should handle a failed submission of data', (done) => {
      importReject(importErr);
      importCredsBtn.click();
      process.nextTick(() => {
        expect(window.alert).toHaveBeenCalledWith(loadErr.stack);
        done();
      });
    });
  });
  
  describe('Delete User', () => {
    let dialog;
    let deleteForm;
    let hiddenInputs;
    let btns;
    
    beforeEach(() => {
      deleteUserBtn.click();
      jest.runAllTimers();
      dialog = window.customDialog;
      deleteForm = document.querySelector('.delete-confirmation');
      hiddenInputs = [...deleteForm.querySelectorAll('input[type="hidden"]')];
      btns = [...deleteForm.querySelectorAll('.segmented-dialog-nav button')];
      deleteSuccessful = false;
    });
    
    it('should make the User confirm the deletion', () => {
      expect(dialog.modal).toBe(true);
      expect(deleteForm.method).toBe('post');
      expect(deleteForm.action.endsWith('/api/user/delete')).toBe(true);
      expect(hiddenInputs[0].name).toBe('username');
      expect(hiddenInputs[0].value).toBe(username);
    });
    
    it('should submit after confirmation', (done) => {
      deleteSuccessful = true;
      btns[1].click();
      process.nextTick(() => {
        jest.runAllTimers();
        
        expect(window.utils.storage.clear).toHaveBeenCalled();
        expect(window.customDialog).toBeUndefined();
        expect(window.location.reload).toHaveBeenCalled();
        
        done();
      });
    });
    
    it('should handle deletion failure', (done) => {
      deleteSuccessful = false;
      btns[1].click();
      process.nextTick(() => {
        jest.runAllTimers();
        
        expect(window.alert).toHaveBeenCalledWith(deleteErr);
        
        done();
      });
    });
    
    it('should allow a User to cancel a deletion', (done) => {
      btns[0].click();
      process.nextTick(() => {
        jest.runAllTimers();
        
        expect(window.customDialog).toBeUndefined();
        
        done();
      });
    });
  });
  
  describe('Update User', () => {
    let updateForm;
    let hiddenInputs;
    let btns;
    let labeledInputs;
    
    beforeEach(() => {
      updateUserBtn.click();
      jest.runAllTimers();
      updateForm = document.querySelector('.update-user-form');
      hiddenInputs = [...updateForm.querySelectorAll('[type="hidden"]')];
      btns = [...updateForm.querySelectorAll('.segmented-dialog-nav button')];
      labeledInputs = getLabeledInputs(updateForm);
    });
    
    it('should display the Update User Dialog', () => {
      expect(updateForm.action.endsWith('/api/user/update')).toBe(true);
      expect(updateForm.method).toBe('post');
      expect(updateForm.getAttribute('autocomplete')).toBe('off');
      expect(updateForm.getAttribute('spellcheck')).toBe('false');
      expect(hiddenInputs[0].name).toBe('oldData[username]');
      expect(hiddenInputs[0].value).toBe(username);
      expect(hiddenInputs[1].name).toBe('oldData[password]');
      expect(hiddenInputs[1].value).toBe(password);
      expect(labeledInputs[0].label.textContent).toBe('Username');
      expect(labeledInputs[0].input.name).toBe('newData[username]');
      expect(labeledInputs[0].input.value).toBe(username);
      expect(labeledInputs[0].input.required).toBe(true);
      expect(labeledInputs[1].label.textContent).toBe('Password');
      expect(labeledInputs[1].input.name).toBe('newData[password]');
      expect(labeledInputs[1].input.value).toBe(password);
      expect(labeledInputs[1].input.required).toBe(true);
    });
    
    describe('submit', () => {
      beforeEach(() => {
        expect(btns[1].disabled).toBe(true);
        
        labeledInputs[0].input.value = 'changedUserName';
        labeledInputs[0].input.dispatchEvent(inputEv);
        jest.runAllTimers();
        updateSuccessful = false;
      });
      
      it('should submit the changed data', (done) => {
        btns[1].click();
        process.nextTick(() => {
          expect(postDataURL.endsWith('/api/user/update')).toBe(true);
          expect(postDataPayload).toEqual(updateForm);
          
          done();
        });
      });
      
      it('should handle a successful update', (done) => {
        updateSuccessful = true;
        btns[1].click();
        process.nextTick(() => {
          jest.runAllTimers();
          expect(window.utils.storage.set).toHaveBeenCalledWith({ userData });
          expect(window.customDialog).toBeUndefined();
          
          done();
        });
      });
      
      it('should handle a failed update', (done) => {
        btns[1].click();
        process.nextTick(() => {
          expect(window.alert).toHaveBeenCalledWith(updateErr);
          
          done();
        });
      });
      
      it('should cancel the update', () => {
        btns[0].click();
        jest.runAllTimers();
        expect(window.customDialog).toBeUndefined();
      });
    });
  });
  
  describe('Hidden Values', () => {
    it('should blur out Cred values', (done) => {
      jest.resetModules();
      window.testCtx.location({ search: '?hideValues=true' })
      require('./credentials');
      document.body.innerHTML = '';
      window.showCredentials();
      
      loadResolve(credsResp);
      process.nextTick(() => {
        jest.runAllTimers();
        
        expect(document.querySelector('.credentials').classList.contains('has--hidden-values')).toBe(true);
        
        done();
      });
    });
  });
});