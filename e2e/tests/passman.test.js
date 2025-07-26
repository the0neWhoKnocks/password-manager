context('Notes', () => {
  const CREDS__USERNAME = 'user';
  const CREDS__PASSWORD = 'pass';
  const E2E_FOLDER = '/repo/e2e';
  const NAMESPACE__STORAGE = 'pass_man';
  const PATH__DATA = `${E2E_FOLDER}/mnt/data`;
  const ROUTE__LOAD_CREDS = '/api/user/creds/load';
  
  function loadPage(path = '/') {
    cy.window().then((win) => {
      let userLoggedIn = false;
      
      if (
        win.localStorage[NAMESPACE__STORAGE]
        || win.sessionStorage[NAMESPACE__STORAGE]
      ) {
        cy.intercept({ method: 'POST', url: ROUTE__LOAD_CREDS }).as('RESP__CREDS');
        cy.log('Alias added for User data');
        userLoggedIn = true;
      }
      else cy.log('No alias added for User data');
      
      cy.log('[PAGE] start load');
      cy.visit(path);
      cy.log('[PAGE] loaded');
      
      if (userLoggedIn) {
        // have to wait for data, otherwise the tests execute too quickly and fail
        cy.log('Wait for creds data');
        cy.wait('@RESP__CREDS');
      }
      else cy.log('Not waiting for User data');
    });
  }
  
  before(() => {
    cy.exec(`rm -rf ${E2E_FOLDER}/cypress/downloads/*`, { log: true }).then(() => {
      cy.log('[DELETED] Previous downloads');
    });
    
    cy.exec(`rm -rf ${E2E_FOLDER}/cypress/screenshots/*`, { log: true }).then(() => {
      cy.log('[DELETED] Previous screenshots');
    });
    
    loadPage();
  });
  
  describe('init', () => {
    before(() => {
      cy.exec(`rm -rf ${PATH__DATA}/*`, { log: true }).then(() => {
        cy.log('[DELETED] Previous app data');
      });
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        cy.log('[CLEARED] storage data');
      });
      cy.reload();
    });
    
    it('should have the correct title', () => {
      cy.title().should('eq', 'Password Manager');
    });
    
    it('should fill out config data', () => {
      cy.get('input[name="cipherKey"]').type('zeffer');
      cy.get('input[name="salt"]').type('pepper');
      cy.screencap('[config] filled out');
    
      cy.get('button[value="create"]').click();
    });
    
    it('should create a new User', () => {
      cy.get(cy.selectors.FORM__LOGIN).as('LOGIN');
      cy.get('@LOGIN').find('button[value="create"]').click();
    
      cy.get(cy.selectors.FORM__CREATE_ACCOUNT).as('CREATE');
      cy.get('@CREATE').find('[name="username"]').type(CREDS__USERNAME);
      cy.get('@CREATE').find('[name="password"]').type(CREDS__PASSWORD);
      cy.get('@CREATE').find('[name="passwordConfirmed"]').type(CREDS__PASSWORD);
      cy.screencap('[create_user] filled out');
      cy.get('@CREATE').find('button[value="create"]').click();
    
      cy.get(cy.selectors.FORM__LOGIN).as('LOGIN');
      cy.login(CREDS__USERNAME, CREDS__PASSWORD, {
        label: '[login_user] incorrect creds filled out',
      });
    
      // going from create to login will persist what was entered, the doubling is expected
      cy.on('window:alert', (txt) => {
        expect(txt).to.contains(`An account for "${CREDS__USERNAME}${CREDS__USERNAME}" doesn't exist.`);
      });
    
      cy.login(CREDS__USERNAME, CREDS__PASSWORD, {
        label: '[login_user] filled out',
        overwrite: true,
      });
    });
    
    it('should display message when no creds exist', () => {
      cy.waitForProgressIndicator();
      cy.get(cy.selectors.MSG__NO_CREDS).contains("No credentials present. Go to Credentials > Add");
      cy.screencap('no notes msg');
    });
  });
  
  describe('Creds', () => {
    
    function setTopNavAliases() {
      cy.get(cy.selectors.TOP_NAV__CREDS).as('TOP_NAV__CREDS');
    }
    
    beforeEach(() => {
      cy.autoLogin(CREDS__USERNAME, CREDS__PASSWORD);
      setTopNavAliases();
    });
    
    describe('First Cred', () => {
      const LABEL = 'temp';
      const items = [
        ['label', LABEL, true], 
        ['username', 'test'],
        ['password', 'password1234', true], 
        ['email', 'test@example.com'], 
        ['website', 'http://test.it'], 
      ];
      
      it('should add credentials', () => {
        // reset data for test
        cy.deleteCred(LABEL);
        
        cy.get(cy.selectors.TOP_NAV__CREDS).click();
        cy.get(cy.selectors.TOP_NAV__CREDS__ADD).click();
        
        cy.wrap(items).each(([name, value, required]) => {
          const req = required ? '[required]' : '';
          cy.get(`${cy.selectors.FORM__CREDS} [name="${name}"]${req}`).type(`{selectall}${value}`);
        });
        cy.get(`${cy.selectors.FORM__CREDS} button`).contains('Add Credentials').should('not.be.disabled');
        cy.get(`${cy.selectors.FORM__INPUT_CREATOR} button`).contains('Add Custom Field').should('exist');
        cy.screencap('Adding creds');
        cy.addCred();
        
        cy.getCredCard(LABEL);
        cy.get('@CARD').find('header').contains(LABEL);
        cy.get('@CARD').find(`${cy.selectors.CRED_CARD}__list-item`).each(($el, ndx) => {
          const [ key, value ] = items[ndx + 1];
          cy.wrap($el).as('ITEM');
          
          switch (key) {
            case 'website': {
              cy.get('@ITEM').find('.credentials-card__list-item-value a').should('have.attr', 'href', value);
              break;
            }
            default: {
              cy.get('@ITEM').invoke('attr', 'title').should('eq', `Click to copy "${key}" value from "${LABEL}"`);
              cy.get('@ITEM').click();
              cy.getClipboard().should('eq', value);
            }
          }
        });
        cy.screencap('Creds added');
      });
      
      it('should edit existing cred', () => {
        cy.editCred(LABEL);
        cy.get(`${cy.selectors.FORM__CREDS} button`).contains('Update Credentials').as('BTN__UPDATE').should('be.disabled');
        cy.wrap(items).each(([name, , required]) => {
          if (!required) {
            cy.get(`${cy.selectors.FORM__CREDS} [name="${name}"]`).type(`{selectall}{backspace}`);
          }
        });
        cy.screencap('Deleting cred items');
        cy.get('@BTN__UPDATE').should('not.be.disabled');
        cy.updateCred();
        
        const [ key, value ] = items[2];
        cy.getCredCard(LABEL).find(`${cy.selectors.CRED_CARD}__list-item`).as('CARD_ITEM').should('have.length', 1);
        cy.get('@CARD_ITEM').find('label').invoke('text').should('eq', key);
        cy.get('@CARD_ITEM').click();
        cy.getClipboard().should('eq', value);
        cy.screencap('Cred fields removed');
      });
      
      it('should add a custom field', () => {
        const key = 'custom field';
        const value = 'custom value';
        
        cy.editCred(LABEL);
        cy.addCustom();
        cy.focused().type(`${key}{enter}`);
        cy.get('[name="customField_1"]').type(value);
        cy.screencap('Adding custom field');
        cy.updateCred();
        
        cy.getCredCard(LABEL).find(`[title='Click to copy "${key}" value from "${LABEL}"']`).click();
        cy.getClipboard().should('eq', value);
      });
      
      it('should hide/show values', () => {
        cy.get('.credentials__hide-values-btn input').as('HIDE_INPUT');
        cy.get('.credentials').as('CREDS');
        
        cy.get('@CREDS').should('not.have.class', 'has--hidden-values');
        cy.get('@HIDE_INPUT').should('not.be.checked').click();
        cy.get('@CREDS').should('have.class', 'has--hidden-values');
        cy.get('.credentials-card__list-item-value span').each(($el) => {
          cy.wrap($el)
            .should('have.css', 'filter')
            .should('include', 'blur(4px)');
        });
        cy.get('@HIDE_INPUT').should('be.checked').click();
        cy.get('@CREDS').should('not.have.class', 'has--hidden-values');
      });
    });
    
    describe('Second Cred', () => {
      const LABEL = 'Android';
      const items = [
        ['label', LABEL], 
        ['password', 'password1234'],
      ];
      
      it('should add credentials', () => {
        // reset data for test
        cy.deleteCred(LABEL);
        
        cy.get(cy.selectors.TOP_NAV__CREDS).click();
        cy.get(cy.selectors.TOP_NAV__CREDS__ADD).click();
        
        cy.wrap(items).each(([name, value]) => {
          cy.get(`${cy.selectors.FORM__CREDS} [name="${name}"]`).type(`{selectall}${value}`);
        });
        cy.addCred();
        cy.screencap('Creds added');
      });
      
      it('should group creds by first letter', () => {
        cy.get('.credentials__cards > *').as('CARD_ELS');
        
        const eqTrimmed = (assertion) => (text) => expect(text.trim()).to.equal(assertion);
        
        cy.get('@CARD_ELS').eq(0).invoke('text').should(eqTrimmed('A'));
        cy.get('@CARD_ELS').eq(1).invoke('attr', 'data-card-label').should('eq', 'android');
        cy.get('@CARD_ELS').eq(2).invoke('text').should(eqTrimmed('T'));
        cy.get('@CARD_ELS').eq(3).invoke('attr', 'data-card-label').should('eq', 'temp');
        cy.screencap('Sorted by first letter');
      });
      
      it('should filter creds', () => {
        cy.get('.credentials__filter-input').as('FILTER');
        
        cy.get('@FILTER').type('{selectall}a');
        cy.get('.credentials__cards > *:visible').should('have.length', 1);
        cy.screencap('Filtered by A');
        
        cy.get('@FILTER').type('{selectall}t');
        cy.get('.credentials__cards > *:visible').should('have.length', 1);
        cy.screencap('Filtered by T');
        
        cy.get('@FILTER').type('{selectall}{backspace}');
        cy.get('.credentials__cards > *:visible').should('have.length', 4);
        cy.screencap('Filter removed');
      });
      
      it('should export/import creds', () => {
        const PATH__DOWNLOADS = Cypress.config('downloadsFolder');
        
        cy.get(cy.selectors.TOP_NAV__CREDS).click();
        cy.get(cy.selectors.TOP_NAV__CREDS__EXPORT).click();
        
        cy.wait(1000); // eslint-disable-line
        cy.exec(`ls ${PATH__DOWNLOADS}/`).then(({ stdout }) => {
          const BACKUP_FILE = `${PATH__DOWNLOADS}/${stdout}`;
          cy.log(`Exported data to "${BACKUP_FILE}"`);
          
          cy.deleteCred('android');
          cy.deleteCred('temp');
          cy.get('.credentials__cards > *:visible').should('have.length', 0);
          cy.screencap('Creds deleted');
          
          cy.get(cy.selectors.TOP_NAV__CREDS).click();
          cy.get(cy.selectors.TOP_NAV__CREDS__IMPORT).click();
          
          cy.get('#tmpFileInput').selectFile(BACKUP_FILE, { force: true });
          cy.waitForProgressIndicator();
          cy.get('.credentials__cards > *:visible').should('have.length', 4);
          cy.screencap('Creds imported from exported data');
        });
      });
    });
  });
  
  describe('User', () => {
    function setTopNavAliases() {
      cy.get(cy.selectors.TOP_NAV__USER).as('TOP_NAV__USER');
    }
    
    beforeEach(() => {
      cy.autoLogin(CREDS__USERNAME, CREDS__PASSWORD);
      setTopNavAliases();
    });
    
    it('should update user data', () => {
      cy.get(cy.selectors.TOP_NAV__USER).click();
      cy.get(cy.selectors.TOP_NAV__USER__UPDATE).click();
      
      cy.get('.update-user-form').as('USER_FORM');
      cy.get('@USER_FORM').find('[name="newData[username]"]').type(`{selectall}${CREDS__USERNAME}1`);
      cy.get('@USER_FORM').find('[name="newData[password]"]').type(`{selectall}${CREDS__PASSWORD}1`);
      cy.screencap('Updating User');
      cy.get('@USER_FORM').find('button[value="update"]').click();
      
      cy.get(cy.selectors.TOP_NAV__USER).click();
      cy.get(cy.selectors.TOP_NAV__USER__LOGOUT).click();
      
      cy.login(`${CREDS__USERNAME}1`, `${CREDS__PASSWORD}1`, {
        label: 'Logging in with updated User data',
        overwrite: true,
      });
      
      cy.get('.credentials__list').should('not.be.empty');
      
      // reset data
      cy.get(cy.selectors.TOP_NAV__USER).click();
      cy.get(cy.selectors.TOP_NAV__USER__UPDATE).click();
      cy.get('.update-user-form').as('USER_FORM');
      cy.get('@USER_FORM').find('[name="newData[username]"]').type(`{selectall}${CREDS__USERNAME}`);
      cy.get('@USER_FORM').find('[name="newData[password]"]').type(`{selectall}${CREDS__PASSWORD}`);
      cy.get('@USER_FORM').find('button[value="update"]').click();
    });
    
    it('should delete user', () => {
      cy.get(cy.selectors.TOP_NAV__USER).click();
      cy.get(cy.selectors.TOP_NAV__USER__DELETE).click();
      cy.screencap('Delete confirmation');
      
      cy.get('.delete-confirmation button').contains('Yes').click();
      
      cy.login(CREDS__USERNAME, CREDS__PASSWORD, { overwrite: true });
      cy.on('window:alert', (txt) => {
        expect(txt).to.contains(`An account for "${CREDS__USERNAME}" doesn't exist.`);
      })
      cy.screencap('Login credentials do not work');
    });
  });
});

