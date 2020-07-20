const {
  appendFileSync,
  existsSync,
  readFileSync,
  unlinkSync,
} = require('fs');
const { resolve } = require('path');
const color = require('cli-color');

const LOG_FILE = resolve(__dirname, './unhandled.log');
const MISSING_ERROR = '[No Error Emitted]';

class UnhandledRejectionReporter {
  constructor(globalConfig, options) {
    this.globalConfig = globalConfig;
    this.options = options;
  }
  
  logExists() {
    try { if (existsSync(LOG_FILE)) return true; }
    // No log created, everything is good.
    catch(e) { return false; }
  }
  
  getLogs() {
    if (this.logExists()) {
      const logs = readFileSync(LOG_FILE, 'utf8');
      return {
        lines: logs.split('\n').filter(Boolean),
        raw: logs,
      };
    }
    
    return {};
  }
  
  onRunStart() {
    if (this.logExists()) unlinkSync(LOG_FILE);
  }
  
  onTestResult({ path: testFile }) {
    const logs = this.getLogs();

    if (logs.lines && logs.lines[logs.lines.length - 1] === MISSING_ERROR) {
      appendFileSync(LOG_FILE, `\n${testFile}\n\n`);
    }
  }

  onRunComplete() {
    const logs = this.getLogs();

    if (logs.raw) {
      process.stdout.write(
        '\n'
        + color.red(`Error: Unhandled Rejection(s) Detected`)
        +`\n\n${color.redBright(logs.raw)}`
      );
      
      // Only exit when not watching for changes
      if (!this.globalConfig.watch) process.exit(1);
    }
  }
}

UnhandledRejectionReporter.rejectionHandler = (err) => {
  const msg = (err)
    ? `${err.message}\n${err.stack}\n\n`
    : MISSING_ERROR;

  appendFileSync(LOG_FILE, msg);
}

module.exports = UnhandledRejectionReporter;
