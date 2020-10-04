#!/usr/bin/env node

const { existsSync, readFileSync, writeFileSync } = require('fs');

// Boilerplate =================================================================

const color = (() => {
  const tty = require('tty');
  const colorize = /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(process.env.TERM) && tty.isatty(1);

  function CLIColor(str = '') {
    const CSI = '\x1b['; // Control Sequence Introducer, read more: https://notes.burke.libbey.me/ansi-escape-codes/#:~:text=ANSI%20escapes%20always%20start%20with,and%20this%20is%20basically%20why.
    const RESET = colorize ? `${CSI}0m` : '';
    const api = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].reduce((obj, color, index) => {
      // foreground
      obj[color] = { get() { return CLIColor(colorize ? `${str}${CSI}${30 + index}m` : str); } };
      obj[`${color}Bright`] = { get() { return CLIColor(colorize ? `${str}${CSI}${90 + index}m` : str); } };
      // background
      obj[`bg${color[0].toUpperCase() + color.slice(1)}`] = { get() { return CLIColor(colorize ? `${str}${CSI}${40 + index}m` : str); } };
      obj[`bg${color[0].toUpperCase() + color.slice(1)}Bright`] = { get() { return CLIColor(colorize ? `${str}${CSI}${100 + index}m` : str); } };

      return obj;
    }, {});
    api.bold = { get() { return CLIColor(colorize ? `${str}${CSI}1m` : str); } };
    api.italic = { get() { return CLIColor(colorize ? `${str}${CSI}3m` : str); } };
    api.underline = { get() { return CLIColor(colorize ? `${str}${CSI}4m` : str); } };

    return Object.defineProperties(msg => `${str}${msg}${RESET}`, api);
  }
  return new CLIColor();
})();

function handleError(exitCode, errMsg) {
  if (exitCode > 0) {
    console.error(`\n ${color.black.bgRed(' ERROR ')} ${color.red(errMsg)}`);
    process.exit(exitCode);
  }
}

const cmd = (cmd, { cwd, onError, silent = true } = {}) => new Promise((resolve, reject) => {
  const { spawn } = require('child_process');
  const opts = { cwd };
  const child = spawn('sh', ['-c', cmd], opts);
  let stdout = '';
  let stderr = '';
  
  child.stdout.on('data', (data) => {
    const out = data.toString();
    if (!silent) process.stdout.write(out);
    stdout += out;
  });
  
  child.stderr.on('data', (data) => {
    const err = data.toString();
    if (!silent) process.stdout.write(err);
    stderr += err;
  });
  
  child.on('close', async (statusCode) => {
    if (statusCode === 0) resolve(
      stdout
        .split('\n')
        .filter(line => !!line.trim())
        .join('\n')
    );
    else {
      if (onError) {
        if (onError.constructor.name === 'AsyncFunction') await onError(stderr);
        else onError(stderr);
      }
      
      const errMsg = `Command "${cmd}" failed\n${stderr}`;
      reject(errMsg);
      handleError(statusCode, errMsg);
    }
  });
});

function renderHeader(prefix, msg) {
  const TERMINAL_WIDTH = process.stdout.columns;
  const PRINTED_PREFIX = ` ${prefix} `;
  
  console.log(
      `\n${color.blue(Array(PRINTED_PREFIX.length + 1).join('▄') + '╓' + Array(TERMINAL_WIDTH - PRINTED_PREFIX.length).join('─'))}`
    + `\n${color.black.bgBlue(PRINTED_PREFIX)}${color.blue('║')} ${color.blue(msg)}`
    + `\n${color.blue(Array(PRINTED_PREFIX.length + 1).join('▀') + '╚' + Array(TERMINAL_WIDTH - PRINTED_PREFIX.length).join('═'))}`
  );
}

const parseArgs = ({ desc, flags }) => {
  const SCRIPT_NAME = require('path').basename(__filename);
  const rawArgs = [...process.argv.slice(2)];
  const args = {};
  let currProp;
  
  flags.push({
    prop: 'help',
    flag: ['--help', '-h'],
    desc: 'Prints out script options and usage.',
  });
  
  while(rawArgs.length) {
    const currArg = rawArgs[0];
    
    if (/^--?/.test(currArg)) currProp = undefined;
    
    if (currProp) {
      args[currProp].push(currArg);
    }
    else {
      for (let i=0; i<flags.length; i++) {
        const { flag, prop } = flags[i];
        
        if (flag.includes(currArg)) {
          currProp = prop;
          args[currProp] = [];
          break;
        }
      }
    }
    
    rawArgs.splice(0, 1);
  }
  
  if (args.help) {
    const TERMINAL_WIDTH = process.stdout.columns;
    const FLAG_COLUMN_LENGTH = flags.reduce((length, { flag }) => Math.max(length, flag.join(', ').length + 1), 0);
    const MIN_DOTS = 2;
    const LEADING_SPACE = ' ';
    const DOTS = Array(FLAG_COLUMN_LENGTH + MIN_DOTS).join('.');
    const flagLines = flags.map(({ desc, flag }) => {
      const flagsStr = flag.join(', ');
      const dots = DOTS.substring(0, DOTS.length - flagsStr.length);
      const lines = [`${LEADING_SPACE}${flagsStr} ${dots}`];
      const descWords = desc.split(/\s/);
      let lineNdx = 0;
      
      descWords.forEach((word, ndx) => {
        let line = lines[lineNdx];
        if (((line + word).length + MIN_DOTS + LEADING_SPACE.length) > TERMINAL_WIDTH) {
          lineNdx++;
          lines.push(Array(FLAG_COLUMN_LENGTH + MIN_DOTS + LEADING_SPACE.length).join(' ') + ' ');
        }
        lines[lineNdx] += ` ${word}`;
      });
      
      return lines.join('\n');
    });
    const flagOptsStr = flags.map(({ flag }) => `[${flag.join(' | ')}]`);
    
    console.log(
        `\n${LEADING_SPACE}${desc}`
      + `\n\n${LEADING_SPACE}Usage: ${SCRIPT_NAME} ${flagOptsStr.join(' ')}`
      + `\n\n${flagLines.join('\n')}`
    );
    process.exit(0);
  }
  
  return args;
};

class CLISelect {
  static hideCursor() { process.stdout.write('\x1B[?25l'); }

  static showCursor() { process.stdout.write('\x1B[?25h'); }
  
  constructor({
    label = '',
    options = [],
    selectedMsg = 'You selected: %s',
  } = {}) {
    const badOpts = options.filter((opt) => opt.length < 2);
    
    if (!label.length) handleError(1, "You didn't provide a `label` for CLISelect");
    if (!options.length) handleError(1, "You didn't provide any `options` for CLISelect");
    if (badOpts.length) handleError(1, `These \`options\` for CLISelect are missing an answer:\n\n ${badOpts.join('\n ')}`);
    
    this.label = label;
    this.rawOptions = options;
    this.ICON__NOT_SELECTED = color.black.bold('■');
    this.ICON__SELECTED = color.blue.bold('■');
    this.rdl = require('readline');
    this.formattedOptions = [];
    this.selectedOptionNdx = 0;
    this.selectedMsg = selectedMsg;
    
    this.render();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');
    CLISelect.hideCursor();
    
    this.handleInputData = this.handleInputData.bind(this);
    process.stdin.on('data', this.handleInputData);
    
    return new Promise((resolve) => {
      this.resolveSelection = resolve;
    });
  }
  
  render() {
    if (this.msgLineCount) this.rdl.moveCursor(process.stdout, 0, -this.msgLineCount);
    
    this.rawOptions.forEach(([opt], ndx) => {
      this.formattedOptions[ndx] = (ndx === this.selectedOptionNdx)
        ? `${this.ICON__SELECTED} ${opt}`
        : `${this.ICON__NOT_SELECTED} ${opt}`;
    });
    
    const msg = `\n ${this.label}\n\n ${this.formattedOptions.join('\n ')}\n`;
    this.msgLineCount = msg.split('\n').length - 1;
    process.stdout.write(msg);
  }

  handleInputData(data) {
    switch (data) {
      case '\r':
      case '\n': return this.enter();
      case '\u0004': // Ctrl-d
      case '\u0003': // CTRL+C
        return this.reset(); 
      case '\u001b[A': return this.upArrow();
      case '\u001b[B': return this.downArrow();
    }
  }
  
  reset() {
    process.stdin.removeListener('data', this.handleInputData);
    process.stdin.setRawMode(false);
    process.stdin.pause();
    CLISelect.showCursor();
    
    if (this.selection === undefined) {
      this.resolveSelection();
      process.exit(0);
    }
  }

  enter() {
    this.selection = this.rawOptions[this.selectedOptionNdx][1];
    this.reset();
    if (this.selectedMsg) console.log(`\n ${this.selectedMsg.replace('%s', color.blue.bold(this.selection))}\n`);
    this.resolveSelection(this.selection);
  }

  upArrow() {
    this.selectedOptionNdx = (this.selectedOptionNdx - 1 < 0)
      ? this.formattedOptions.length - 1
      : this.selectedOptionNdx - 1;
    this.render();
  }

  downArrow() {
    this.selectedOptionNdx = (this.selectedOptionNdx + 1 === this.formattedOptions.length)
      ? 0
      : this.selectedOptionNdx + 1;
    this.render();
  }
}

// Script specific =============================================================

(async function release() {
  const {
    APP__TEST_URL,
    CMD__DOCKER_BUILD,
    CMD__DOCKER_START,
    CMD__COMPILE_ASSETS,
    DOCKER__IMG_NAME,
    PATH__CREDS__DOCKER,
    PATH__REPO_ROOT,
  } = require('./release-config.js');
  const PACKAGE_JSON = require(`${PATH__REPO_ROOT}/package.json`);
  const args = parseArgs({
    desc: 'A zero dependency script to help you release/publish code.',
    flags: [
      {
        prop: 'dryRun',
        flag: ['--dry-run', '-dr'],
        desc: "Prints out everything that'll happen. Won't actually deploy any code.",
      },
      {
        prop: 'showCreds',
        flag: ['--show-credentials', '-sc'],
        desc: "Prints credentials, despite being run with --dry-run.",
      },
    ],
  });
  let newChanges;
  
  let rollbacks = [];
  async function rollbackRelease() {
    if (rollbacks.length) {
      console.log(`\n ${color.black.bgYellow(' ROLLBACK ')} release`);
      // changes may have been additive, so roll things back from the end to the start
      for (let i=rollbacks.length - 1; i>=0; i--) {
        const { cmd: _cmd, content, file, label } = rollbacks[i];
        if (_cmd) await cmd(_cmd, { cwd: PATH__REPO_ROOT });
        else if (file) writeFileSync(file, content);
        
        console.log(` - Reverted: ${color.blue.bold(label)}`);
      }
      
      rollbacks = [];
    }
  }
  
  function dryRunCmd(_cmd) {
    console.log(`\n ${color.black.bgYellow(' DRYRUN ')} ${color.blue.bold(_cmd)}`);
  }

  // Get current version number
  const ORIGINAL_VERSION = PACKAGE_JSON.version;
  const REPO_URL = (await cmd('git config --get remote.origin.url'))
    .replace(/^git@/, 'https://')
    .replace('.com:', '.com/')
    .replace(/\.git$/, '');
  // Build out what the version would be based on what the user chooses
  const VERSION_NUMS = ORIGINAL_VERSION.split('.');
  const MAJOR = `${+VERSION_NUMS[0] + 1}.0.0`;
  const MINOR = `${VERSION_NUMS[0]}.${+VERSION_NUMS[1] + 1}.0`;
  const PATCH = `${VERSION_NUMS[0]}.${VERSION_NUMS[1]}.${+VERSION_NUMS[2] + 1}`;

  renderHeader('BUMP', 'versions');
  const NEW_VERSION = await new CLISelect({
    label: 'Choose version:',
    options: [
      [`${color.green(PATCH)} ${color.black.bold('[Patch]')}`, PATCH],
      [`${color.yellow(MINOR)} ${color.black.bold('[Minor]')}`, MINOR],
      [`${color.red(MAJOR)} ${color.black.bold('[Major]')}`, MAJOR],
    ],
    selectedMsg: 'Bumping version to: %s',
  });
  const VERSION_STR = `v${NEW_VERSION}`;

  // Ensure tags are up to date
  renderHeader('FETCH', 'tags');
  await cmd('git fetch --tags', { silent: false });
  
  // Get previous tag info so that the changelog can be updated.
  let latestTagOrSHA;
  renderHeader('GET', 'latest tag or SHA');
  if (await cmd('git tag -l')) {
    latestTagOrSHA = await cmd('git describe --abbrev=0');
    console.log(`\n Latest tag: ${color.blue.bold(latestTagOrSHA)}`);
  }
  else {
    latestTagOrSHA = await cmd('git rev-parse --short $(git rev-list --max-parents=0 HEAD)');
    console.log(`\n No tags found, using first SHA: ${color.blue.bold(latestTagOrSHA)}`);
  }

  // Run tests if they exist
  const HAS_TEST_SCRIPT = PACKAGE_JSON.scripts && PACKAGE_JSON.scripts.test;
  if (HAS_TEST_SCRIPT) {
    renderHeader('RUN', 'tests');
    const testCmd = `cd ${PATH__REPO_ROOT} && npm test`;
    (args.dryRun)
      ? dryRunCmd(testCmd)
      : await cmd(testCmd, { silent: false });
  }
  
  if (latestTagOrSHA) {
    renderHeader('ADD', 'new CHANGELOG items');
    
    const CHANGELOG_PATH = `${PATH__REPO_ROOT}/CHANGELOG.md`;
    const DEFAULT_CHANGELOG_CONTENT = '# Changelog\n---\n';
    
    if (!existsSync(CHANGELOG_PATH)) {
      writeFileSync(CHANGELOG_PATH, DEFAULT_CHANGELOG_CONTENT);
    }

    // const commits = await cmd('git log "v3.1.0".."v4.0.0" --oneline');
    const commits = await cmd(`git log "${latestTagOrSHA}"..HEAD --oneline`);
    const categories = {
      'Bugfixes': [],
      'Dev-Ops': [],
      'Features': [],
      'Misc. Tasks': [],
      'Uncategorized': [],
    };
    
    try {
      const TITLE_PREFIX = ': ';
      commits.split('\n')
        .map(commit => commit.replace(/^([a-z0-9]+)\s/i, `- [$1](${REPO_URL}/commit/$1) `))
        .forEach(commit => {
          if (commit.includes(' fix: ')) categories['Bugfixes'].push(commit.replace(' fix:', TITLE_PREFIX));
          else if (commit.includes(' ops: ')) categories['Dev-Ops'].push(commit.replace(' ops:', TITLE_PREFIX));
          else if (commit.includes(' feat: ')) categories['Features'].push(commit.replace(' feat:', TITLE_PREFIX));
          else if (commit.includes(' chore: ')) categories['Misc. Tasks'].push(commit.replace(' chore:', TITLE_PREFIX));
          else categories['Uncategorized'].push(commit);
        });
      
      newChanges = Object.keys(categories)
        .map(category => {
          const categoryItems = categories[category];
          return (categoryItems.length)
            ? `**${category}**\n${categoryItems.join('\n')}`
            : null;
        })
        .filter(category => !!category)
        .join('\n\n');
    }
    catch (err) { handleError(1, "Couldn't parse commit messages"); }
    
    // Add changes to top of logs
    const originalLog = readFileSync(CHANGELOG_PATH, 'utf8');
    if (newChanges) {
      const newLog = `\n## ${VERSION_STR}\n\n${newChanges}\n\n---\n`;
      const changelog = originalLog.replace(
        new RegExp(`(${DEFAULT_CHANGELOG_CONTENT})`),
        `$1${newLog}`
      );
      
      if (args.dryRun) {
        const trimmedLog = changelog.slice(0, `${DEFAULT_CHANGELOG_CONTENT}${newLog}`.length);
        dryRunCmd(`writeFileSync(\n  '${CHANGELOG_PATH}',\n${trimmedLog}\n[...rest of file]\n\n)`);
      }
      else {
        writeFileSync(CHANGELOG_PATH, changelog);
        rollbacks.push({ label: 'CHANGELOG', file: CHANGELOG_PATH, content: originalLog });
      }
    }
  }
  
  renderHeader('BUMP', 'Node package version');
  const NPM_BUMP_CMD = `npm version --no-git-tag-version ${NEW_VERSION}`;
  if (args.dryRun) dryRunCmd(NPM_BUMP_CMD);
  else {
    rollbacks.push({
      label: 'Node package version',
      cmd: `npm version --no-git-tag-version --allow-same-version ${ORIGINAL_VERSION}`,
    });
    await cmd(NPM_BUMP_CMD, {
      cwd: PATH__REPO_ROOT,
      onError: rollbackRelease,
      silent: false,
    });
  }
  
  if (CMD__COMPILE_ASSETS) {
    renderHeader('COMPILE', 'assets');
    if (args.dryRun) dryRunCmd(CMD__COMPILE_ASSETS);
    else await cmd(CMD__COMPILE_ASSETS, {
      cwd: PATH__REPO_ROOT,
      onError: rollbackRelease,
      silent: false,
    });
  }
  
  if (CMD__DOCKER_BUILD) {
    renderHeader('BUILD', 'Docker Image');
    if (args.dryRun) dryRunCmd(CMD__DOCKER_BUILD);
    else await cmd(CMD__DOCKER_BUILD, {
      cwd: PATH__REPO_ROOT,
      onError: rollbackRelease,
      silent: false,
    });
  }
  
  renderHeader('START', 'App');
  if (CMD__DOCKER_START) {
    if (args.dryRun) dryRunCmd(CMD__DOCKER_START);
    else {
      await cmd(CMD__DOCKER_START, {
        cwd: PATH__REPO_ROOT,
        onError: rollbackRelease,
        silent: false,
      });
    }
  }
  
  const continueRelease = await new CLISelect({
    label: `${color.green('Verify things are running properly at')}: ${color.blue.bold.underline(APP__TEST_URL)}`,
    options: [
      ['Continue with release', true],
      ['Abort release', false],
    ],
    selectedMsg: null,
  });
  
  renderHeader('STOP', 'App');
  if (CMD__DOCKER_START) {
    if (!args.dryRun) {
      await cmd('docker-compose down', {
        cwd: PATH__REPO_ROOT,
        onError: rollbackRelease,
        silent: false,
      });
    }
  }

  if (continueRelease) {
    renderHeader('ADD', 'updated files');
    const ADD_CMD = 'git add -f CHANGELOG.md package*.json';
    if (args.dryRun) dryRunCmd(ADD_CMD);
    else {
      await cmd(ADD_CMD, {
        cwd: PATH__REPO_ROOT,
        onError: rollbackRelease,
        silent: false,
      });
      rollbacks.push({ label: 'Staged changes', cmd: 'git reset' });
    }

    renderHeader('COMMIT', 'updated files');
    const COMMIT_CMD = `git commit -m "Bump to ${VERSION_STR}"`;
    if (args.dryRun) dryRunCmd(COMMIT_CMD);
    else {
      await cmd(COMMIT_CMD, {
        cwd: PATH__REPO_ROOT,
        onError: rollbackRelease,
        silent: false,
      });
      rollbacks.push({ label: 'Bump commit', cmd: 'git reset --soft HEAD~1' });
    }
    
    renderHeader('GIT_TAG', 'the release');
    const GIT_CHANGELOG_MSG = `## ${VERSION_STR}\n\n${newChanges}`.replace(/"/g, '\\"');
    const GIT_TAG_CMD = `git tag -a "${VERSION_STR}" -m "${GIT_CHANGELOG_MSG}"`;
    if (args.dryRun) dryRunCmd(GIT_TAG_CMD);
    else {
      await cmd(GIT_TAG_CMD, {
        cwd: PATH__REPO_ROOT,
        onError: rollbackRelease,
        silent: false,
      });
      rollbacks.push({ label: 'Git tag', cmd: `git tag -d "${VERSION_STR}"` });
    }
    
    let DOCKER_USER, DOCKER_PASS, DOCKER_TAG;
    if (PATH__CREDS__DOCKER) {
      [DOCKER_USER, DOCKER_PASS] = readFileSync(PATH__CREDS__DOCKER, 'utf8').split('\n');
      const LATEST_REGEX = new RegExp(`^${DOCKER__IMG_NAME}.*latest`);
      const LATEST_ID = (await cmd('docker images')).split('\n').filter(line => LATEST_REGEX.test(line)).map(line => line.split(/\s+/)[2])[0];
      
      if (args.dryRun && !args.showCreds) {
        DOCKER_USER = '******';
        DOCKER_PASS = '******';
      }
      
      DOCKER_TAG = `${DOCKER__IMG_NAME}:${VERSION_STR}`;
      
      renderHeader('DOCKER_TAG', 'the release');
      const DOCKER_TAG_CMD = `docker tag "${LATEST_ID}" "${DOCKER_TAG}"`;
      if (args.dryRun) dryRunCmd(DOCKER_TAG_CMD);
      else {
        await cmd(DOCKER_TAG_CMD, {
          cwd: PATH__REPO_ROOT,
          onError: rollbackRelease,
          silent: false,
        });
        rollbacks.push({ label: 'Docker tag', cmd: `docker rmi "${DOCKER_TAG}"` });
      }
    }
    
    const finalizeRelease = await new CLISelect({
      label: color.yellow.bold('Finalize release by deploying all data?'),
      options: [
        [color.green.bold('Yes, finalize'), true],
        [color.red.bold('No, abort!'), false],
      ],
      selectedMsg: null,
    });
    
    if (finalizeRelease) {
      renderHeader('PUSH', 'Git commit and tag');
      const GIT_PUSH_CMD = 'git push --follow-tags';
      if (args.dryRun) dryRunCmd(GIT_PUSH_CMD);
      else {
        await cmd(GIT_PUSH_CMD, {
          cwd: PATH__REPO_ROOT,
          onError: rollbackRelease,
          silent: false,
        });
      }
      
      renderHeader('PUSH', 'Docker tags');
      const DOCKER_PUSH_CMD =
          `docker login -u="${DOCKER_USER}" -p="${DOCKER_PASS}"`
        +` && docker push "${DOCKER_TAG}"`
        +` && docker push "${DOCKER__IMG_NAME}:latest"`;
      if (args.dryRun) dryRunCmd(DOCKER_PUSH_CMD);
      else {
        await cmd(DOCKER_PUSH_CMD, {
          cwd: PATH__REPO_ROOT,
          silent: false,
        });
      }
      
      let GITHUB_TOKEN = await cmd('git config --global github.token');
      if (GITHUB_TOKEN) {
        if (args.dryRun && !args.showCreds) GITHUB_TOKEN = '******';
        
        const REMOTE_ORIGIN_URL = await cmd('git config --get remote.origin.url');
        const urlMatches = REMOTE_ORIGIN_URL.match(/^(https|git)(:\/\/|@)([^/:]+)[/:]([^/:]+)\/(.+).git$/);
        
        renderHeader('CREATE', 'GitHub release');
        
        if (urlMatches) {
          const BRANCH = await cmd('git rev-parse --abbrev-ref HEAD');
          const JSON_PAYLOAD = JSON.stringify({
            body: GIT_CHANGELOG_MSG,
            draft: false,
            name: VERSION_STR,
            prerelease: false,
            tag_name: VERSION_STR,
            target_commitish: BRANCH,
          });
          const GH_USER = urlMatches[4];
          const GH_REPO = urlMatches[5];
          const GH_API__RELEASE_URL = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/releases`;
          // https://developer.github.com/v3/repos/releases/#create-a-release
          const CURL_CMD = [
            'curl',
            '-H "Content-Type: application/json"',
            `-H "Authorization: token ${GITHUB_TOKEN}"`,
            '-X POST',
            `-d '${JSON_PAYLOAD.replace(/'/g, '\\u0027')}'`,
            '--silent --output /dev/null --show-error --fail',
            GH_API__RELEASE_URL,
          ].join(' ');
          
          if (args.dryRun) {
            console.log(
                 `  ${color.green('Payload')}: ${JSON.stringify(JSON.parse(JSON_PAYLOAD), null, 2)}`
              +`\n  ${color.green('URL')}: ${color.blue.bold.underline(GH_API__RELEASE_URL)}`
            );
            dryRunCmd(CURL_CMD);
          }
          else await cmd(CURL_CMD, { silent: false });
        }
        else {
          console.log(`\n ${color.black.bgYellow(' WARN ')} ${color.yellow("Couldn't parse the origin URL for GH release creation")}`);
        }
      }
      else {
        console.log(`\n ${color.black.bgYellow(' WARN ')} ${color.yellow('Skipping GH release creation: No GH token found')}`);
      }
    }
    else {
      await rollbackRelease();
    }
  }
  else {
    await rollbackRelease();
  }
})();
