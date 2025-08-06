import { exec as _exec } from 'node:child_process';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { test, expect } from '@playwright/test';
import { NAMESPACE__LOGGER } from '@src/constants';

const PATH__REL_SCREENSHOTS = 'artifacts/screenshots';
const PATH__ABS_SCREENSHOTS = `/e2e/${PATH__REL_SCREENSHOTS}`;
const screenshotNdxs = {};

const exec = promisify(_exec);
const genShotKeys = (testInfo) => {
  const testFileKey = testInfo.titlePath[0].replace(/\.test\.js$/, '');
  const testNameKey = `[${testInfo.titlePath[1]}]`;
  
  return { testFileKey, testNameKey }; 
};
const genShotPrefix = ({ testFileKey, testNameKey }) => {
  return `${testFileKey}/${testNameKey}`.toLowerCase().replace(/\s/g, '-');
};
const pad = (num) => `${num}`.padStart(2, '0');


export default class BaseFixture {
  constructor({ browser, context, page, testCtx, testInfo, useLogs = false, useWS = false }) {
    if (!testCtx.fixture) testCtx.fixture = this;
    testCtx.fixtures.push(this);
    
    this.browser = browser;
    this.ctx = context;
    this.fx = testCtx.fixture;
    this.page = page;
    this.testCtx = testCtx;
    this.testInfo = testInfo;
    
    const { testFileKey, testNameKey } = genShotKeys(testInfo);
    this.testFileKey = testFileKey;
    this.testNameKey = testNameKey;
    this.ndxKey = `${this.testFileKey}_${this.testNameKey}`;
    this.shotNamePrefix = genShotPrefix({ testFileKey, testNameKey });
    
    // `visibilitychange` doesn't work when creating new pages. All pages are
    // considered active and don't go into a background state. This is a known
    // issue/feature: https://github.com/microsoft/playwright/issues/3570.
    // This hack, gets around that for now.
    this.pageVisibility = {
      hide: () => this.pageVisibility.toggle('hide'),
      show: () => this.pageVisibility.toggle('show'),
      toggle: (state) => {
        return this.fx.page.evaluate((state) => {
          Object.defineProperty(document, 'visibilityState', { value: (state === 'hide') ? 'hidden' : 'visible', writable: true });
          Object.defineProperty(document, 'hidden', { value: state === 'hide', writable: true });
          document.dispatchEvent(new Event('visibilitychange'));
        }, state);
      },
    };
    
    page.dialogMsg = null;
    page.on('dialog', async (d) => {
      page.dialogMsg = d.message();
      await d.accept();
    });
    
    if (useLogs) {
      page.consoleLogs = [];
      page.on('console', (msg) => {
        if (msg.text().includes(`${NAMESPACE__LOGGER}:`)) {
          page.consoleLogs.push(msg.text().split(`${NAMESPACE__LOGGER}:`)[1]);
        }
      });
    }
    
    if (useWS) {
      page.wsMsgs = {};
      page.on('websocket', (ws) => {
        ws.on('framereceived', ({ payload }) => {
          const { data, type } = JSON.parse(payload);
          if (type !== 'pong') page.wsMsgs[type] = data;
        });
      });
    }
  }
  
  /**
   * Run a command via CLI.
   *
   * @param {...*} args Any arguments that run the CLI command.
   *
   * @return {Promise}
   */
  static exec(...args) { return exec(...args); }
  
  /**
   * Check if a file/folder exists.
   *
   * @param {String} path The file/folder being checked.
   *
   * @return  {Promise}
   */
  static async fileExists(path) {
    return !!(await stat(path).catch((_) => false));
  }
  
  /**
   * Loads a file's data, allowing the User to transform it, and then saves the
   * updated data to the same file.
   *
   * @param {String} fP The path of the file to be updated.
   * @param {Function} transform A function that'll change the loaded data. It needs to return the altered data.
   * @param {Object} [opts] Options
   * @param {String} [opts.type="json"] The type of data being edited.
   *
   * @return {Promise}
   */
  static async updateFile(fP, transform, { type = 'json' } = {}) {
    let data = await readFile(fP, 'utf8');
    if (type === 'json') data = JSON.parse(data);
    
    let newData = transform(data);
    if (type === 'json') newData = JSON.stringify(newData, null, 2);
    
    await writeFile(fP, newData, 'utf8');
  }
  
  /**
   * Choose file in a File picker.
   *
   * @param {String} filePath The path to the picked file.
   * @param {Function} fn Triggers the opening of the File picker.
   *
   * @return  {Promise}
   * @example
   * await this.chooseFile('/path/to/file.txt', async () => { await uploadBtn.click(); });
   */
  async chooseFile(filePath, fn) {
    const [ fcPromise ] = await Promise.all([
      this.fx.page.waitForEvent('filechooser'),
      fn(),
    ]);
    
    const fileChooser = await fcPromise;
    await fileChooser.setFiles(filePath);
  }
  
  clearLogs() {
    this.fx.page.consoleLogs = [];
  }
  
  clearSocketMsgs() {
    this.fx.page.wsMsgs = {};
  }
  
  async closePage(pageNum) {
    const fNdx = pageNum - 1;
    const fx = this.testCtx.fixtures[fNdx];
    
    await fx.page.close();
    await fx.ctx.close();
    
    this.testCtx.fixtures.splice(fNdx, 1);
  }
  
  async createPage() {
    const ctx = await this.fx.browser.newContext();
    const page = await ctx.newPage();
    
    new this.constructor({
      browser: this.fx.browser,
      context: ctx,
      page,
      testCtx: this.testCtx,
      testInfo: this.fx.testInfo,
    });
  }
  
  async downloadFile(fn) {
    const [ download ] = await Promise.all([
      this.fx.page.waitForEvent('download'),
      fn(),
    ]);
    const suggestedFileName = download.suggestedFilename();
    const filePath = `/tmp/${suggestedFileName}`;
    
    await download.saveAs(filePath);
    
    return filePath;
  }
  
  async elExists(sel, cb) {
    if ( (await this.getElBySelector(sel).count()) ) await cb();
  }
  
  getElBySelector(sel) {
    return this.fx.page.locator(sel);
  }
  
  getFocusedEl() {
    return this.getElBySelector('*:focus');
  }
  
  getURLParts() {
    return new URL(this.fx.page.url());
  }
  
  async goOffline() {
    await this.fx.ctx.setOffline(true);
  }
  
  async goOnline() {
    await this.fx.ctx.setOffline(false);
  }
  
  async loadPage(str) {
    const route = (str)
      ? (str.startsWith('http')) ? str : `/${str}`
      : '';
    await this.fx.page.goto(route);
  }
  
  async logDispatched(msg) {
    await expect(async () => {
      // Since the logs contain styling codes, I can only check that the log contains text, not exact.
      const firstMatch = this.fx.page.consoleLogs.toReversed().find((m) => m.includes(msg));
      await expect(firstMatch).toContain(msg);
    }).toPass({
      intervals: [100, 500, 1000, 2000],
      timeout: 4000,
    });
  }
  
  async readClipboard() {
    await this.fx.ctx.grantPermissions(['clipboard-read']);
    const handle = await this.fx.page.evaluateHandle(() => navigator.clipboard.readText());
    const txt = await handle.jsonValue();
    await handle.dispose();
    return txt;
  }
  
  async screenshot(name, loc) {
    const _loc = (typeof loc === 'string') ? this.getElBySelector(loc) : loc; 
    if (!screenshotNdxs[this.fx.ndxKey]) screenshotNdxs[this.fx.ndxKey] = 1;
    
    const screenshotNdx = screenshotNdxs[this.fx.ndxKey];
    const formattedName = `${`${this.fx.shotNamePrefix}_${pad(screenshotNdx)}__${name}`.toLowerCase().replace(/\s/g, '-')}`;
    const filename = `${PATH__REL_SCREENSHOTS}/${formattedName}.jpg`;
    
    screenshotNdxs[this.fx.ndxKey] += 1;
    
    const el = (_loc) ? _loc : this.fx.page;
    const img = await el.screenshot({
      animations: 'disabled', // stops CSS animations, CSS transitions and Web Animations.
      fullPage: !_loc,
      path: filename,
      quality: 90,
      type: 'jpeg',
    });
    await this.testInfo.attach(formattedName, {
      body: img,
      contentType: 'image/jpeg',
    });
  }
  
  async switchToPage(pageNum) {
    await this.pageVisibility.hide(); // old page hidden
    
    this.fx = this.testCtx.fixtures[pageNum - 1];
    await this.fx.page.bringToFront();
    await this.pageVisibility.show(); // current page visible
    await expect(this.getElBySelector('body')).toBeAttached();
  }
  
  async typeStuff(loc, txt) {
    const parts = txt.split(/(\{[^}]+\})/).filter((str) => !!str);
    const keyReg = /^\{([^}]+)\}$/;
    
    for (let t of parts) {
      // eslint-disable-next-line playwright/no-conditional-in-test
      if (keyReg.test(t)) {
        const [ , key ] = t.match(keyReg);
        await loc.press(key);
      }
      else await loc.pressSequentially(t);
    }
  }
  
  async verifyAlert(msg, fn) {
    const dialogPromise = this.fx.page.waitForEvent('dialog');
    await fn();
    await dialogPromise;
    
    await expect(
      await this.fx.page.dialogMsg,
      'should display alert containin message'
    ).toContain(msg);
  }
  
  async verifyCSS(loc, { pseudo, ...props }) {
    const _props = Object.keys(props);
    const css = await loc.evaluate(($el, _pseudo) => {
      return getComputedStyle($el, _pseudo);
    }, pseudo);
    
    for (let i=0; i<_props.length; i++) {
      const prop = _props[i];
      await expect(css[prop]).toEqual(props[prop]);
    }
  }
  
  async verifyPageTitle(title) {
    expect(await this.fx.page.title()).toEqual(title);
  }
  
  async waitForDialog(selector) {
    let dialog = this.getElBySelector('.dialog');
    
    if (selector) {
      dialog = dialog.filter({
        has: this.getElBySelector(selector),
        visible: true,
      });
    }
    
    await dialog.waitFor({ state: 'visible' });
    
    return dialog;
  }
  
  async waitForAnimations(loc) {
    await loc.evaluate(el => {
      const anims = el.getAnimations({ subtree: true }).map(animation => animation.finished);
      return Promise.all(anims).catch((_) => {});
    });
  }
  
  waitForResp(...args) { return this.fx.page.waitForResponse(...args); }
  
  async writeClipboard() {
    await this.fx.ctx.grantPermissions(['clipboard-write']);
  }
}

export function createTest({
  afterTest,
  beforeTest,
  FxClass,
  fxKey,
}) {
  const removed = {};
  
  return test.extend({
    [fxKey]: async ({ browser, context, page }, use, testInfo) => {
      const testCtx = {
        fixture: undefined,
        fixtures: [],
      };
      
      // [ before test ] =========================================================
      const rmPath = `${PATH__ABS_SCREENSHOTS}/${genShotPrefix(genShotKeys(testInfo))}`;
      if (!removed[rmPath]) {
        await test.step(`Remove old screenshots for "${rmPath}"`, async () => {
          await exec(`rm -rf "${rmPath}"*`); // without quotes, the brackets get misinterpreted
        });
        removed[rmPath] = true;
      }
      
      if (beforeTest) await beforeTest({ browser, context, page, testCtx, testInfo });
      
      // [ test ] ================================================================
      await use(new FxClass({ browser, context, page, testCtx, testInfo }));
      
      // [ after test ] ==========================================================
      if (afterTest) await afterTest({ browser, context, page, testCtx, testInfo });
    },
  });
}

export { expect };
