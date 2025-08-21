import { exec as _exec } from 'node:child_process';
import { readFile, stat, writeFile } from 'node:fs/promises';
import colors from '@colors/colors/safe';
import { test, expect as baseExpect } from '@playwright/test';

const PATH__REL_SCREENSHOTS = 'artifacts/screenshots';
const PATH__ABS_SCREENSHOTS = `/e2e/${PATH__REL_SCREENSHOTS}`;
const screenshotNdxs = {};

const exec = async (cmd, { failOnNonZeroExit = true } = {}) => {
  console.log(`[BaseFixture] exec(${cmd}, { failOnNoZeroExit: ${failOnNonZeroExit} })`);
  
  return new Promise((resolve, reject) => {
    _exec(cmd, { shell: '/bin/bash' }, (err, stdout, stderr) => {
      if (err && failOnNonZeroExit) {
        console.error(`----------\n${stderr}`);
        reject(stderr);
      }
      else {
        if (stdout) console.log(`----------\n${stdout}`);
        resolve(stdout);
      }
    });
  });
};
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
  constructor({
    browser,
    context,
    loggerNamespace,
    page,
    testCtx,
    testInfo,
    useLogs = false,
    useWS = false,
  }) {
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
    
    this.debug = {
      // eslint-disable-next-line playwright/no-page-pause
      pause: () => page.pause(), // Requires `use: { headless: false }` in your config.
    };
    
    page.dialogMsg = null;
    page.on('dialog', async (d) => {
      page.dialogMsg = d.message();
      await d.accept();
    });
    
    if (useLogs) {
      page.consoleLogs = [];
      page.on('console', (msg) => {
        if (msg.text().includes(`${loggerNamespace}:`)) {
          page.consoleLogs.push(msg.text().split(`${loggerNamespace}:`)[1]);
        }
      });
    }
    
    if (useWS) {
      page.wsHandlers = [];
      page.on('websocket', (ws) => {
        ws.on('framereceived', ({ payload }) => {
          if (page.wsHandlers.length) {
            const { type, ...data } = JSON.parse(payload);
            for (const handler of page.wsHandlers) { handler(type, data); }
          }
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
  
  async clearStorage() {
    await this.fx.page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  }
  
  click(loc) {
    const self = this;
    return {
      // NOTE: `loc.click` doesn't move the mouse when `position` is set,
      // the `click` still appears to occur in the center of the element. So I
      // have to manually:
      // - Press/unPress the keyboard modifier if it is set.
      // - Click at the specified location of the element.
      /**
       * Clicks a specific point on the Page.
       *
       * @param {Array} modifiers Array of Keys that are down while clicking.
       * @param {Number} x The X position where the cursor will click on the Page.
       * @param {Number} y The Y position where the cursor will click on the Page.
       *
       * @return {Promise}
       * @example
       * const { height, left, top } = await loc.evaluate(e => e.getBoundingClientRect());
       * await app.click(loc).atPosition({
       *   modifiers: ['Shift'],
       *   x: parentOffsetX + left + 100,
       *   y: top + (height/2),
       * });
       */
      atPosition: async ({ modifiers, x, y }) => {
        if (modifiers) {
          for (const mod of modifiers) {
            await self.fx.page.keyboard.down(mod);
          }
        }
        await self.fx.page.mouse.click(x, y);
        if (modifiers) {
          for (const mod of modifiers) {
            await self.fx.page.keyboard.up(mod);
          }
        }
      },
      noScroll: async () => { await loc.dispatchEvent('click'); },
    };
  }
  
  async closePage(pageNum) {
    const fNdx = pageNum - 1;
    const fx = this.testCtx.fixtures[fNdx];
    
    await fx.page.close();
    await fx.ctx.close();
    
    this.testCtx.fixtures.splice(fNdx, 1);
  }
  
  // The original page will be disposed, but any other created pages will
  // hang around eating up memory.
  async closeStragglingPages() {
    for (let i=this.testCtx.fixtures.length; i>1; i--) {
      await this.closePage(i);
    }
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
  
  async elExists(sel) {
    const loc = (typeof sel === 'string') ? this.getEl(sel) : sel;
    return !!(await loc.count());
  }
  
  getEl(sel, opts) {
    return this.fx.page.locator(sel, opts);
  }
  
  getFocusedEl() {
    return this.getEl('*:focus');
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
  
  async loadPage(path = '/') {
    let _path = path;
    
    if (
      !!_path
      && !_path.startsWith('http')
      && !_path.startsWith('/')
    ) _path = `/${_path}`;
    
    await this.fx.page.goto(_path);
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
  
  /**
   * Return a mock asset for a Client asset request.
   *
   * @param {String|RegExp} routePattern A plain string, glob, or regular expression that matches as URL.
   * @param {String} mockFilePath The path to the mock file.
   *
   * @return {Promise}
   */
  async mockClientAsset(routePattern, mockFilePath) {
    await this.fx.page.route(routePattern, async (route) => {
      await route.fulfill({ path: mockFilePath });
    });
  }
  
  async readClipboard() {
    // NOTE: There's an odd quirk where I could be running tests individually
    // and the clipboard reads fine. But when running all tests (serially in order)
    // the clipboard somehow returns random function names of previous tests,
    // clipboard values from tests that come after, or the expected value. Tried
    // a bunch of fixes, nothing worked except for waiting.
    await this.fx.page.waitForTimeout(300); // eslint-disable-line playwright/no-wait-for-timeout
    
    await this.fx.ctx.grantPermissions(['clipboard-read']);
    
    const handle = await this.fx.page.evaluateHandle(async () => {
      const txt = await navigator.clipboard.readText();
      return txt;
    });
    const txt = await handle.jsonValue();
    await handle.dispose();
    return txt;
  }
  
  async reloadPage() {
    await this.fx.page.reload();
  }
  
  async screenshot(name, loc) {
    const _loc = (typeof loc === 'string') ? this.getEl(loc) : loc; 
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
  
  scroll(loc) {
    if (!loc) loc = this.getEl('body');
    const scrollOpts = { behavior: 'smooth' };
    
    function scrollHandler(el, [ scrollProp, elProp, scrollOpts ]) {
      return new Promise((resolve) => {
        let _el = el;
        let scrollX = 'scrollLeft';
        let scrollY = 'scrollTop';
        
        if (el.nodeName === 'BODY') {
          _el = window;
          scrollX = 'scrollX';
          scrollY = 'scrollY';
        }
        
        const pos = (typeof elProp === 'number') ? elProp : el[elProp];
        const { duration, offset = 0, ...restOpts } = scrollOpts;
        
        if (duration) {
          const endPos = pos + offset;
          const div = 3;
          const posInt = endPos / div;
          const int = setInterval(() => {
            if (scrollProp === 'top') {
              _el.scrollTo(_el[scrollX], _el[scrollY] + posInt);
              if (_el[scrollY] === endPos) clearInterval(int);
            }
            else {
              _el.scrollTo(_el[scrollX] + posInt, _el[scrollY]);
              if (_el[scrollX] === endPos) clearInterval(int);
            }
          }, duration / div);
        }
        else {
          _el.scroll({
            ...restOpts,
            [scrollProp]: pos + offset,
          });
        }
        
        let prevPos;
        const int = setInterval(() => {
          const currPos = _el[(scrollProp === 'top') ? scrollY : scrollX];
          if (currPos === prevPos) {
            clearInterval(int);
            resolve();
          }
          prevPos = currPos;
        }, 100);
      });
    }
    
    return {
      intoView: (opts) => loc.evaluate((el, { offset = 0, scrollOpts } = {}) => {
        function getScrollParent(node) {
          if (!node) return undefined;
        
          let parent = node.parentElement;
          while (parent) {
            const { overflow } = window.getComputedStyle(parent);
            if (overflow.split(' ').every(o => o === 'auto' || o === 'scroll')) return parent;
            parent = parent.parentElement;
          }
        
          return document.documentElement;
        }
        
        let scrollEl = getScrollParent(el);
        if (scrollEl === document.body) scrollEl = window;
        const scrollProp = (scrollEl.scrollY !== undefined) ? 'scrollY' : 'scrollTop';
        const offsetPosition = (
          el.getBoundingClientRect().top
          - document.body.getBoundingClientRect().top
          - offset
        );
        
        return new Promise((resolve) => {
          if (offsetPosition) {
            scrollEl.scrollTo({
              ...scrollOpts,
              top: scrollEl[scrollProp] + offsetPosition,
            });
            
            let prevPos;
            const int = setInterval(() => {
              const currPos = scrollEl[scrollProp];
              if (currPos === prevPos) {
                clearInterval(int);
                resolve();
              }
              prevPos = currPos;
            }, 100);
          }
          else resolve();
        });
      }, { ...scrollOpts, ...opts  }),
      to: async (x, y, opts) => {
        if (x !== undefined) await loc.evaluate(scrollHandler, ['left', x, { ...scrollOpts, ...opts }]);
        if (y !== undefined) await loc.evaluate(scrollHandler, ['top', y, { ...scrollOpts, ...opts }]);
      },
      toBottom: (opts) => loc.evaluate(scrollHandler, ['top','scrollHeight', { ...scrollOpts, ...opts }]),
      toLeft: (opts) => loc.evaluate(scrollHandler, ['left', 0, { ...scrollOpts, ...opts }]),
      toRight: (opts) => loc.evaluate(scrollHandler, ['left', 'scrollWidth', { ...scrollOpts, ...opts }]),
      toTop: (opts) => loc.evaluate(scrollHandler, ['top', 0, { ...scrollOpts, ...opts }]),
    };
  }
  
  async switchToPage(pageNum) {
    await this.pageVisibility.hide(); // old page hidden
    
    this.fx = this.testCtx.fixtures[pageNum - 1];
    await this.fx.page.bringToFront();
    await this.pageVisibility.show(); // current page visible
    await expect(this.getEl('body')).toBeAttached();
  }
  
  async typeStuff(loc, txt, waitAfter) {
    const parts = txt.split(/(\{[^}]+\})/).filter((str) => !!str);
    const keyReg = /^\{([^}]+)\}$/;
    
    for (let t of parts) {
      if (keyReg.test(t)) {
        const [ , key ] = t.match(keyReg);
        await loc.press(key);
      }
      else await loc.pressSequentially(t);
    }
    
    if (waitAfter) await this.fx.page.waitForTimeout(waitAfter);  // eslint-disable-line playwright/no-wait-for-timeout
  }
  
  async waitForDialog(selector) {
    let dialog = this.getEl('.dialog');
    
    if (selector) {
      const loc = (typeof selector === 'string')
        ? this.getEl(selector)
        : selector;
      dialog = dialog.filter({ has: loc, visible: true });
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
  
  async waitForPageChange(fn) {
    const nav = this.fx.page.waitForNavigation();
    await fn();
    await nav;
  }
  
  waitForResp(...args) { return this.fx.page.waitForResponse(...args); }
  
  /**
   * Wait for a WS message with a specific payload.
   *
   * @param {String} msgType A WS message type.
   * @param {Function} execFn Execute this to trigger the WS message.
   * @param {Function} [msgFn] Checks if the WS message has a specific payload.
   *
   * @return {Promise}
   * @example
   * await app.waitForWSMsg(
   *   'get user data',
   *   async () => { await btn.click(); },
   *   (data) => data.done,
   * );
   */
  async waitForWSMsg(msgType, execFn, msgFn) {
    const _msgFn = (msgFn) ? msgFn : () => true;
    const promise = new Promise((resolve) => {
      const handler = (type, data) => {
        if (type === msgType && _msgFn(data)) {
          this.fx.page.wsHandlers.splice(this.fx.page.wsHandlers.indexOf(handler), 1);
          resolve(data);
        }
      }
      
      this.fx.page.wsHandlers.push(handler);
    });
    
    await execFn();
    
    return promise;
  }
  
  async writeClipboard(txt) {
    await this.fx.ctx.grantPermissions(['clipboard-write']);
    await this.fx.page.evaluate(async (_txt) => {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': _txt }),
      ]);
    }, txt);
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

// NOTE: They've written their own color util, but the playwright-core package
// is 8mb. I don't need all that for some color codes. Luckily `colors` is
// compatibale with how they're outputting colors and it's only 40kb.
// All it's methods are lised here: https://github.com/microsoft/playwright/blob/release-1.54/packages/playwright-core/src/utils/isomorphic/colors.ts
export const wrapBad = (str) => colors.red(str);
export const wrapGood = (str) => colors.green(str);

// Add in [custom matchers](https://playwright.dev/docs/test-assertions#add-custom-matchers-using-expectextend)
export const expect = baseExpect.extend({
  async toBeOpaque(loc, { pseudo } = {}) {
    const opacity = +(await loc.evaluate(
      (e, _pseudo) => window.getComputedStyle(e, _pseudo).opacity,
      pseudo
    ));
    const pass = opacity > 0;
    const expected = this.isNot ? '0' : 'greater than 0';
    const message = [
      `Locator: ${loc}${pseudo ? `::${pseudo}` : ''}`,
      `Expected: Opacity to be ${wrapGood(expected)}, but it was ${wrapBad(opacity)}`,
    ].join('\n');
    
    return {
      message: () => message,
      pass,
    };
  },
  
  async toContainCSS(loc, { pseudo, ...props } = {}) {
    const rgbToHex = (rgb) => {
      let [ , r, g, b, a ] = rgb.match(/rgba?\((\d+), (\d+), (\d+)(?:, (\d+))?\)/);
      let hex = (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
      
      if (a === undefined) a = 1;
      a = ((a * 255) | 1 << 8).toString(16).slice(1);
      
      return `#${hex + a}`;
    };
    
    const css = await loc.evaluate(($el, [ _pseudo, _props]) => {
      const s = getComputedStyle($el, _pseudo);
      return Object.keys(_props).reduce((obj, key) => {
        if (key.startsWith('--')) obj[key] = s.getPropertyValue(key);
        else obj[key] = s[key];
        return obj;
      }, {});
    }, [pseudo, props]);
    let pass = true;
    const styleBlock = [];
    
    for (const prop in props) {
      const expectedVal = props[prop];
      let actualVal = css[prop];
      
      if (expectedVal.startsWith('#')) {
        actualVal = rgbToHex(css[prop]);
        if (expectedVal.length === 7) actualVal = actualVal.slice(0, 7);
      }
      
      const _pass = expectedVal === actualVal;
      if (!_pass) pass = false;
      
      styleBlock.push(`${prop}: ${!_pass ? '(expected) ' : ''}${wrapGood(expectedVal)}${!_pass ? ` | (actual) ${wrapBad(actualVal)}` : ''};`);
    }
    
    const message = [
      `Locator: ${loc}${pseudo ? `::${pseudo}` : ''}`,
      `Expected: Element styling to ${this.isNot ? 'not ' : ''}have value(s):\n{\n${styleBlock.map(l => `  ${l}`).join('\n')}\n}`,
    ].join('\n');
    
    return {
      message: () => message,
      pass,
    };
  },
  
  /**
   * Verify an Alert message was displayed.
   *
   * @param {Object} page The Page Object.
   * @param {Function} fn A function that triggers the Alert message to open.
   * @param {RegExp|String} expectedMsg The message that should have been displayed.
   *
   * @return {Promise}
   * @example
   * await expect(app.page).toHaveAlertMsg(
   *   async () => { await app.page.evaluate(() => { alert('zippy'); }); },
   *   'zippy'
   * );
   */
  async toHaveAlertMsg(page, fn, expectedMsg) {
    const dialogPromise = page.waitForEvent('dialog');
    await fn();
    await dialogPromise;
    const msg = page.dialogMsg;
    const pass = (expectedMsg instanceof RegExp)
      ? expectedMsg.test(msg)
      : expectedMsg.includes(msg);
    
    return {
      message: () => `Expected alert message to ${this.isNot ? 'not ' : ''}contain "${wrapGood(expectedMsg)}", but it had "${wrapBad(msg)}"`,
      pass,
    };
  },
  
  async toHaveQueryParam(page, params = {}) {
    const actualParams = await page.evaluate(() => {
      return [...new URLSearchParams(location.search)].reduce((obj, [ prop, val ]) => {
        obj[prop] = val;
        return obj;
      }, {});
    });
    
    const formattedParams = [];
    let pass = true;
    
    for (const name in params) {
      const expectedParam = params[name];
      const actualParam = actualParams[name];
      const _pass = (expectedParam instanceof RegExp)
        ? expectedParam.test(actualParam)
        : expectedParam === actualParam;
      
      if (!_pass) pass = false;
      
      formattedParams.push(`${name}: ${!_pass ? '(expected) ' : ''}${wrapGood(expectedParam)}${!_pass ? ` | (actual) ${wrapBad(actualParam)}` : ''}`);
    }
    
    return {
      message: () => `Expected query parameter(s) to ${this.isNot ? 'not ' : ''}have value(s):\n\n${formattedParams.map(l => `  ${l}`).join('\n')}`,
      pass,
    };
  },
  
  async toHaveTitle(page, expectedTitle) {
    const title = await page.title();
    const pass = (expectedTitle instanceof RegExp)
      ? expectedTitle.test(title)
      : expectedTitle === title;
    
    return {
      message: () => `Expected page title to ${this.isNot ? 'not ' : ''}equal "${wrapGood(expectedTitle)}", but it was "${wrapBad(title)}"`,
      pass,
    };
  },
});
export const expectImg = baseExpect.extend({
  async toBeLoaded(loc) {
    await loc.evaluate((e) => new Promise((resolve) => {
      const int = setInterval(() => {
        if (e.complete) {
          clearInterval(int);
          resolve();
        }
      }, 100);
    }));
    
    return { pass: true };
  },
});
