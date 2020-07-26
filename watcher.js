const { create } = require('browser-sync');
const nodemon = require('nodemon');
const { SERVER_PORT } = require('./src/constants');

const browserSync = create();
const PORT = +process.env.SERVER_PORT || SERVER_PORT;
const LOG_PREFIX = '[WATCHER]';
let httpModule;
let protocol = 'http';
let bSyncHTTPS;

if (process.env.NODE_EXTRA_CA_CERTS) {
  httpModule = require('https');
  protocol = 'https';
  bSyncHTTPS = {
    cert: process.env.NODE_EXTRA_CA_CERTS,
    key: process.env.NODE_EXTRA_CA_CERTS.replace('.crt', '.key'),
  }
}
else {
  httpModule = require('http');
}

const checkServer = () => new Promise((rootResolve, rootReject) => {
  let count = 0;
  const check = () => new Promise((resolve, reject) => {
    setTimeout(() => {
      const serverAddress = `${protocol}://localhost:${ PORT }`;
      
      console.log(`${ LOG_PREFIX } Pinging ${ serverAddress }`);
      httpModule
        .get(serverAddress, (res) => resolve(res))
        .on('error', (err) => reject(err));
    }, 1000);
  });
  const handleError = (err) => {
    if(count < 3){
      ping();
      count++;
    }
    else{
      console.log(err)
      rootReject();
    }
  };
  const handleSuccess = () => { rootResolve(); };
  const ping = () => {
    check()
      .then(handleSuccess)
      .catch(handleError);
  };
  
  ping();
});

nodemon({
  delay: 500,
  script: './src/server',
  watch: [
    './src/server/**/*.js'
  ],
})
  .on('restart', () => {
    console.log(`${ LOG_PREFIX } Server restarting because file(s) changed`);
    
    checkServer()
      .then(() => {
        console.log('Server has fully started');
        browserSync.reload();
      })
      .catch(() => {
        console.log("Couldn't detect the server, a manual reload may be required");
      });
  });

// https://www.browsersync.io/docs/options
browserSync.init({
  files: [
    'src/client/css/app.css',
    'src/client/js/**/*.js',
    'src/client/index.html',
  ],
  ghostMode: false, // don't mirror interactions in other browsers
  https: bSyncHTTPS,
  // logLevel: 'debug',
  notify: false, // Don't show any notifications in the browser.
  open: false,
  port: PORT + 1,
  proxy: {
    target: `${protocol}://localhost:${PORT}`,
  },
  reloadDebounce: 300, // Wait for a specified window of event-silence before sending any reload events.
  snippetOptions: {
    rule: {
      match: /<\/body>/i,
      fn: (snippet) => snippet,
    },
  },
  ui: {
    port: PORT + 2,
  },
});

function killWatcher(evType) {
  console.log(`${ LOG_PREFIX } Killing watcher (${ evType })`);
  nodemon.emit('quit');
  process.exit(0);
}

process.on('SIGINT', killWatcher.bind(null, 'SIGINT'));
process.on('SIGTERM', killWatcher.bind(null, 'SIGTERM'));
process.on('SIGUSR2', killWatcher.bind(null, 'SIGUSR2'));
