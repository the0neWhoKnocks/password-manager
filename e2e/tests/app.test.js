import {
  ROUTE__USER__CREDS__IMPORT,
  ROUTE__USER__CREDS__LOAD,
  USERS_PATH,
} from '@src/constants';
import {
  SELECTOR__CRED_CARD__ITEM,
  SELECTOR__CRED_CARD__ITEM_VALUE,
  AppFixture,
  expect,
  test,
} from './fixtures/AppFixture';

const CREDS__USERNAME = 'user';
const CREDS__PASSWORD = 'pass';
const E2E_FOLDER = '/e2e';
const PATH__DATA = `${E2E_FOLDER}/mnt/data`;
const { exec } = AppFixture;

test.describe.configure({ mode: 'serial' }); // Required to stop tests on failure.

test.beforeEach(async ({ app }) => {
  await app.loadPage();
});

test.describe('Init', () => {
  test('Page Title', async ({ app }) => {
    await app.verifyPageTitle('Password Manager');
  });
  
  test('Fill Out Config Data', async ({ app }) => {
    const { createConfigForm, loginForm } = app.els;
    
    await exec(`rm -rf ${PATH__DATA}/*`);
    await app.clearStorage();
    await app.page.reload();
    
    await app.waitForDialog(createConfigForm).toBeVisible();
    await app.getElBySelector('input[name="cipherKey"]').fill('zeffer');
    await app.getElBySelector('input[name="salt"]').fill('pepper');
    await app.screenshot('[config] filled out');
    
    await app.getElBySelector('button[value="create"]').click();
    await app.waitForDialog(loginForm).toBeVisible();
  });
  
  test('Create a New User', async ({ app }) => {
    const { createAccountForm, loginForm } = app.els;
    
    await exec(`rm -f ${USERS_PATH}`);
    
    await app.waitForDialog(loginForm).toBeVisible();
    await loginForm.locator('button[value="create"]').click();
    
    await app.waitForDialog(createAccountForm).toBeVisible();
    await createAccountForm.locator('[name="username"]').fill(CREDS__USERNAME);
    await createAccountForm.locator('[name="password"]').fill(CREDS__PASSWORD);
    await createAccountForm.locator('[name="passwordConfirmed"]').fill(CREDS__PASSWORD);
    await app.screenshot('[create_user] filled out');
    await createAccountForm.locator('button[value="create"]').click();
    
    await app.verifyAlert(
      `An account for "${CREDS__USERNAME}${CREDS__USERNAME}" doesn't exist.`,
      async () => {
        await app.login(CREDS__USERNAME, CREDS__PASSWORD, {
          label: '[login_user] incorrect creds filled out',
        });
      }
    );
  
    await app.login(CREDS__USERNAME, CREDS__PASSWORD, {
      label: '[login_user] filled out',
      overwrite: true,
    });
  });
  
  test('Display Message When No Creds Exist', async ({ app }) => {
    const { noCredsMsg } = app.els;
    
    await app.waitForProgressIndicator();
    await app.autoLogin(CREDS__USERNAME, CREDS__PASSWORD);
    await expect(noCredsMsg).toContainText('No credentials present. Go to Credentials > Add');
    await app.screenshot('no notes msg');
  });
});

test.describe('Creds', () => {
  test.beforeEach(async ({ app }) => {
    await app.autoLogin(CREDS__USERNAME, CREDS__PASSWORD);
    await expect(app.getElBySelector('.credentials')).toBeVisible();
  });
  
  test.describe('First Cred', () => {
    const LABEL = 'temp';
    const items = [
      ['label', LABEL, true], 
      ['username', 'test'],
      ['password', 'password1234', true], 
      ['email', 'test@example.com'], 
      ['website', 'http://test.it'], 
    ];
    
    test('Add Credentials', async ({ app }) => {
      const {
        addCredsBtn,
        addCustomFieldBtn,
        credsForm,
        topNav: {
          addCreds,
          credsMenu,
        },
      } = app.els;
      
      await exec(`rm -f ${PATH__DATA}/creds_*.json`);
      
      await credsMenu.click();
      await addCreds.click();
      
      for (const [ name, value, required ] of items) {
        const req = required ? '[required]' : '';
        await credsForm.locator(`[name="${name}"]${req}`).fill(value);
      }
      await expect(addCredsBtn).toBeEnabled();
      await expect(addCustomFieldBtn).toBeVisible();
      await app.screenshot('Adding creds');
      await app.addCred();
      
      const card = app.getCredCard(LABEL);
      const cardItems = await card.locator(SELECTOR__CRED_CARD__ITEM).all();
      await expect(card.locator('header')).toContainText(LABEL);
      for (const [ ndx, item ] of cardItems.entries()) {
        const [ key, value ] = items[ndx + 1];
        
        switch (key) {
          case 'website': {
            await expect(item.locator(`${SELECTOR__CRED_CARD__ITEM_VALUE} a`)).toHaveAttribute('href', value);
            break;
          }
          default: {
            await expect(item).toHaveAttribute('title', `Click to copy "${key}" value from "${LABEL}"`);
            await item.click();
            expect(await app.readClipboard()).toEqual(value);
          }
        }
      }
      await app.screenshot('Creds added');
    });
    
    test('Edit Existing Cred', async ({ app }) => {
      const { credsForm, updateCredsBtn } = app.els;
      
      await app.editCred(LABEL);
      await expect(updateCredsBtn).toBeDisabled();
      for (const [ name, , required ] of items) {
        if (!required) await credsForm.locator(`[name="${name}"]`).fill('');
      }
      await app.screenshot('Deleting cred items');
      await expect(updateCredsBtn).toBeEnabled();
      await app.updateCred();
      
      const [ key, value ] = items[2];
      const cardItem = app.getCredCard(LABEL).locator(SELECTOR__CRED_CARD__ITEM);
      await expect(cardItem).toHaveCount(1);
      await expect(cardItem.locator('label')).toHaveText(key);
      await cardItem.click();
      expect(await app.readClipboard()).toEqual(value);
      await app.screenshot('Cred fields removed');
    });
    
    test('Add a Custom Field', async ({ app }) => {
      const key = 'custom field';
      const value = 'custom value';
      
      await app.editCred(LABEL);
      await app.addCustom();
      await app.typeStuff(app.getFocusedEl(), `${key}{Enter}`);
      await app.getElBySelector('[name="customField_1"]').fill(value);
      await app.screenshot('Adding custom field');
      await app.updateCred();
      
      await app.getCredCard(LABEL).locator(`[title='Click to copy "${key}" value from "${LABEL}"']`).click();
      expect(await app.readClipboard()).toEqual(value);
    });
    
    test('Hide/Show Values', async ({ app }) => {
      const MODIFIER = 'has--hidden-values';
      const hideInput = app.getElBySelector('.credentials__hide-values-btn input');
      const creds = app.getElBySelector('.credentials');
      
      await expect(creds).not.toContainClass(MODIFIER);
      await expect(hideInput).not.toBeChecked()
      await hideInput.click();
      await expect(creds).toContainClass(MODIFIER);
      const els = await app.getElBySelector(`${SELECTOR__CRED_CARD__ITEM_VALUE} span`).all();
      for (const el of els) {
        await app.verifyCSS(el, { filter: 'blur(4px)' });
      }
      
      await expect(hideInput).toBeChecked()
      await hideInput.click();
      await expect(creds).not.toContainClass(MODIFIER);
    });
  });
  
  test.describe('Second Cred', () => {
    const LABEL = 'Android';
    const items = [
      ['label', LABEL], 
      ['password', 'password1234'],
    ];
    
    test('Add Credentials', async ({ app }) => {
      const { credsForm, topNav: { addCreds, credsMenu } } = app.els;
      
      // reset data for test
      await app.deleteCred(LABEL);
      
      await credsMenu.click();
      await addCreds.click();
      for (const [ name, value ] of items) {
        await credsForm.locator(`[name="${name}"]`).fill(value);
      }
      await app.addCred();
      await app.screenshot('Creds added');
    });
    
    test('Group Creds by First Letter', async ({ app }) => {
      const cardEls = app.getElBySelector('.credentials__cards > *');
      
      await expect(cardEls.nth(0)).toHaveText('A');
      await expect(cardEls.nth(1)).toHaveAttribute('data-card-label', 'android');
      await expect(cardEls.nth(2)).toHaveText('T');
      await expect(cardEls.nth(3)).toHaveAttribute('data-card-label', 'temp');
      await app.screenshot('Sorted by first letter');
    });
    
    test('Filter Creds', async ({ app }) => {
      const { filterInput, visibleCreds } = app.els;
      
      await filterInput.fill('a');
      await expect(visibleCreds).toHaveCount(1);
      await app.screenshot('Filtered by A');
      
      await filterInput.fill('t');
      await expect(visibleCreds).toHaveCount(1);
      await app.screenshot('Filtered by T');
      
      await filterInput.fill('');
      await expect(visibleCreds).toHaveCount(4);
      await app.screenshot('Filter removed');
    });
    
    test('Export/Import Creds', async ({ app }) => {
      const {
        topNav: {
          credsMenu,
          exportCreds,
          importCreds,
        },
        visibleCreds,
      } = app.els;
      
      await credsMenu.click();
      const backupFile = await app.downloadFile(async () => {
        await exportCreds.click();
      });
      
      await app.deleteCred('android');
      await app.deleteCred('temp');
      await expect(visibleCreds).toHaveCount(0);
      await app.screenshot('Creds deleted');
      
      await credsMenu.click();
      const importResp = app.waitForResp(`**${ROUTE__USER__CREDS__IMPORT}`);
      const loadResp = app.waitForResp(`**${ROUTE__USER__CREDS__LOAD}`);
      await app.chooseFile(backupFile, async () => { await importCreds.click(); });
      await importResp;
      await loadResp;
      await expect(visibleCreds).toHaveCount(4);
      await app.screenshot('Creds imported from exported data');
    });
  });
});

test.describe('User', () => {
  test.beforeEach(async ({ app }) => {
    await app.autoLogin(CREDS__USERNAME, CREDS__PASSWORD);
  });
  
  test('Update User Data', async ({ app }) => {
    const {
      topNav: {
        logOut,
        userMenu,
        updateUser,
      },
      userForm,
    } = app.els;
    const uInput = userForm.locator('[name="newData[username]"]');
    const pInput = userForm.locator('[name="newData[password]"]');
    const updateBtn = userForm.locator('button[value="update"]');
    
    await userMenu.click();
    await updateUser.click();
    
    await uInput.fill(`${CREDS__USERNAME}1`);
    await pInput.fill(`${CREDS__PASSWORD}1`);
    await app.screenshot('Updating User');
    await updateBtn.click();
    
    await userMenu.click();
    await logOut.click();
    
    await app.login(`${CREDS__USERNAME}1`, `${CREDS__PASSWORD}1`, {
      label: 'Logging in with updated User data',
      overwrite: true,
    });
    
    await expect(app.getElBySelector('.credentials__list')).toBeVisible();
    
    // reset data
    await userMenu.click();
    await updateUser.click();
    await uInput.fill(CREDS__USERNAME);
    await pInput.fill(CREDS__PASSWORD);
    await updateBtn.click();
  });
  
  test('Delete User', async ({ app }) => {
    const { topNav: { deleteUser, userMenu } } = app.els;
    
    await userMenu.click();
    await deleteUser.click();
    await app.screenshot('Delete confirmation');
    
    await app.getElBySelector('.delete-confirmation button:text-is("Yes")').click();
    
    await app.verifyAlert(
      `An account for "${CREDS__USERNAME}" doesn't exist.`,
      async () => {
        await app.login(CREDS__USERNAME, CREDS__PASSWORD, { overwrite: true });
      }
    );
    await app.screenshot('Login credentials do not work');
  });
});
