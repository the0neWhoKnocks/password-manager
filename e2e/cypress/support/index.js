// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';
import selectors from './selectors';

before(() => {
  // expose selectors to each test
  cy.selectors = selectors;
});

function abortEarly() {
  if (
    this.currentTest.state === 'failed'
    && this.currentTest.currentRetry() === this.currentTest.retries()
  ) {
    Cypress.runner.stop();
  }
}
beforeEach(abortEarly);
afterEach(abortEarly);
