import {
  ROUTE__USER__CREDS__ADD,
  ROUTE__USER__CREDS__LOAD,
  ROUTE__USER__LOGIN,
} from '@src/constants';
import BaseFixture, { createTest, expect } from './BaseFixture';

const NAMESPACE__STORAGE = 'passman';
const SELECTOR__CRED_CARD = '.credentials-card';
export const SELECTOR__CRED_CARD__ITEM = `${SELECTOR__CRED_CARD}__list-item`;
export const SELECTOR__CRED_CARD__ITEM_VALUE = `${SELECTOR__CRED_CARD__ITEM}-value`;
const SELECTOR__FORM__LOGIN = '#loginForm';
const SELECTOR__TOP_NAV = '.credentials__top-nav';

export class AppFixture extends BaseFixture {
  constructor({ browser, context, page, testCtx, testInfo }) {
    super({ browser, context, page, testCtx, testInfo });
    
    const credsForm = this.getElBySelector('.creds-form');
    const credsMenu = this.getElBySelector(`${SELECTOR__TOP_NAV} custom-drop-down[label="Credentials"]`);
    const inputCreator = this.getElBySelector('.input-creator-form');
    const userMenu = this.getElBySelector(`${SELECTOR__TOP_NAV} custom-drop-down[label="User"]`);
    this.els = {
      addCredsBtn: credsForm.locator('button:text-is("Add Credentials")'),
      addCustomFieldBtn: inputCreator.locator('button:has-text("Add Custom Field")'),
      createAccountForm: this.getElBySelector('#createAccount'),
      createConfigForm: this.getElBySelector('#createConfig'),
      credsForm,
      filterInput: this.getElBySelector('.credentials__filter-input'),
      inputCreator,
      loginForm: this.getElBySelector(SELECTOR__FORM__LOGIN),
      noCredsMsg: this.getElBySelector('.no-creds-msg'),
      progressIndicator: this.getElBySelector('.load-progress-indicator'),
      topNav: {
        addCreds: credsMenu.locator('#addCreds'),
        credsMenu,
        deleteUser: userMenu.locator('#deleteUser'),
        exportCreds: credsMenu.locator('#exportCreds'),
        importCreds: credsMenu.locator('#importCreds'),
        logOut: userMenu.locator('#logout'),
        updateUser: userMenu.locator('#updateUser'),
        userMenu,
      },
      updateCredsBtn: credsForm.locator('button:text-is("Update Credentials")'),
      userForm: this.getElBySelector('.update-user-form'),
      visibleCreds: this.getElBySelector('.credentials__cards > *:visible'),
    };
  }
  
  async addCred() {
    const { addCredsBtn, credsForm } = this.els;
    
    const resp = this.waitForResp(`**${ROUTE__USER__CREDS__ADD}`);
    await addCredsBtn.click();
    await resp;
    await this.waitForDialog(credsForm).toBeHidden();
  }
  
  async addCustom() {
    const { addCustomFieldBtn } = this.els;
    await addCustomFieldBtn.click();
  }
  
  async autoLogin(username, password) {
    await this.elExists(SELECTOR__FORM__LOGIN, async () => {
      await this.login(username, password);
    });
  }
  
  async clearStorage() {
    await this.fx.page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  }
  
  async deleteCred(label) {
    const CARD_SELECTOR = `${SELECTOR__CRED_CARD}[data-card-label="${label}"]`;
    
    await this.elExists(CARD_SELECTOR, async () => {
      await this.getElBySelector(`${CARD_SELECTOR} [value="delete"]`).click();
      await this.getElBySelector('.delete-confirmation button:text-is("Yes")').click();
    });
    
    await expect(this.getElBySelector('.delete-confirmation')).toHaveCount(0);
  }
  
  async editCred(label) {
    await this.getCredCard(label).locator('button:text-is("Edit")').click();
  }
  
  getCredCard(id) {
    return this.getElBySelector(`${SELECTOR__CRED_CARD}[data-card-label="${id}"]`);
  }
  
  async loadPage(path = '/') {
    await this.fx.page.goto(path);
    
    const userLoggedIn = await this.fx.page.evaluate((ns) => {
      return !!(window.localStorage[ns] || window.sessionStorage[ns])
    }, NAMESPACE__STORAGE);
    
    const credsResp = (userLoggedIn)
      ? this.waitForResponse(`**${ROUTE__USER__CREDS__LOAD}`)
      : Promise.resolve();
    await credsResp;
  }
  
  async login(username, password, { label, overwrite } = {}) {
    const { loginForm } = this.els;
    const uInput = loginForm.locator('[name="username"]');
    const pInput = loginForm.locator('[name="password"]');
    
    await this.waitForDialog(loginForm).toBeVisible();
    
    if (overwrite) {
      await uInput.fill(username);
      await pInput.fill(password);
    }
    else {
      await this.typeStuff(uInput, `{End}${username}`);
      await this.typeStuff(pInput, `{End}${password}`);
    }
    
    if (label) await this.screenshot(label);
    
    const resp = this.waitForResp(`**${ROUTE__USER__LOGIN}`);
    await loginForm.locator('button[value="login"]').click();
    await resp;
  }
  
  async updateCred() {
    const { credsForm, updateCredsBtn } = this.els;
    await updateCredsBtn.click();
    await expect(credsForm).toHaveCount(0);
  }
  
  waitForDialog(loc) {
    const self = this;
    const wcDialog = this.getElBySelector('custom-dialog').filter({ has: loc });
    const dialog = wcDialog.locator('.dialog');
    
    return {
      async toBeHidden() {
        await expect(dialog).not.toContainClass(['show', 'closing']);
        const handle = await self.page.$('.dialog'); // eslint-disable-line playwright/no-element-handle
        await handle.waitForElementState('hidden');
      },
      async toBeVisible() {
        await expect(dialog).toContainClass('show');
        const handle = await self.page.$('.dialog'); // eslint-disable-line playwright/no-element-handle
        await handle.waitForElementState('stable');
      },
    };
  }
  
  async waitForProgressIndicator() {
    const { progressIndicator } = this.els;
    await expect(progressIndicator).toBeHidden();
  }
}

export const test = createTest({ FxClass: AppFixture, fxKey: 'app' });
export { expect };
