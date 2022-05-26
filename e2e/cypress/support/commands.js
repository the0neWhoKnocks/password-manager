// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import selectors from './selectors';

const pad = (num, token='00') => token.substring(0, token.length-`${ num }`.length) + num;
let screenshotNdx = 0;

Cypress.Commands.add('screencap', (name, selectorOrEl) => {
  let el = cy;
  screenshotNdx++;
  
  if (selectorOrEl) {
    el = (typeof selectorOrEl === 'string')
      ? cy.get(selectorOrEl, { timeout: 3000 })
      : selectorOrEl;
  }
  
  el.screenshot(`${pad(screenshotNdx)}__${name.replace(/\s/g, '-')}`);
});

Cypress.Commands.add('login', (username, password, { label, overwrite } = {}) => {
  cy.get(selectors.FORM__LOGIN).as('LOGIN');
  cy.get('@LOGIN').find('[name="username"]').type(`${overwrite ? '{selectall}' : ''}${username}`);
  cy.get('@LOGIN').find('[name="password"]').type(`${overwrite ? '{selectall}' : ''}${password}`);
  if (label) cy.screencap(label);
  cy.get('@LOGIN').find('button[value="login"]').click();
});

// sometimes a test can be isolated, and a login may be required
Cypress.Commands.add('autoLogin', (username, password) => {
  cy.window().then((win) => {
    if (win.document.querySelector(selectors.FORM__LOGIN)) {
      cy.log('Login prompted');
      cy.login(username, password);
    }
    else cy.log('No Login prompted');
  });
});

Cypress.Commands.add('waitForProgressIndicator', () => {
  cy.get(selectors.PROGRESS_INDICATOR).should('not.be.visible');
});

Cypress.Commands.add('getCredCard', (id) => {
  return cy.get(`${selectors.CRED_CARD}[data-card-label="${id}"]`).as('CARD');
});

Cypress.Commands.add('deleteCred', (label) => {
  cy.waitForProgressIndicator();
  cy.window().then((win) => {
    const CARD_SELECTOR = `${selectors.CRED_CARD}[data-card-label="${label}"]`;
  
    if (win.document.querySelector(CARD_SELECTOR)) {
      cy.get(`${CARD_SELECTOR} [value="delete"]`).click();
      cy.get('.delete-confirmation button').contains('Yes').click();
      cy.log(`Deleted Cred Card for "${label}"`);
    }
    else {
      cy.log(`No Cred Card found for "${CARD_SELECTOR}"`);
    }
    
    cy.get('.delete-confirmation').should('not.exist');
  });
});
Cypress.Commands.add('editCred', (label) => {
  cy.waitForProgressIndicator();
  cy.getCredCard(label);
  cy.get('@CARD').find('button').contains('Edit').click();
});

Cypress.Commands.add('getClipboard', () => {
  return cy.window().invoke('navigator.clipboard.readText');
});

Cypress.Commands.add('addCustom', () => {
  cy.get(`${selectors.FORM__INPUT_CREATOR} button`).contains('Add Custom Field').click();
});

Cypress.Commands.add('addCred', () => {
  cy.get(`${cy.selectors.FORM__CREDS} button`).contains('Add Credentials').click();
  cy.get(cy.selectors.FORM__CREDS).should('not.exist');
});

Cypress.Commands.add('updateCred', () => {
  cy.get(`${cy.selectors.FORM__CREDS} button`).contains('Update Credentials').click();
  cy.get(cy.selectors.FORM__CREDS).should('not.exist');
});
