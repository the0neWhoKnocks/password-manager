const { existsSync } = require('fs');
const glob = require('glob');
const mkdirp = require('mkdirp');
const returnErrorResp = require('../utils/returnErrorResp');
const log = require('../utils/logger').logger('middleware:view');
const {
  CONFIG_PATH,
  DATA_PATH,
  PUBLIC_JS,
} = require('../../constants');

function ensureFolderStructure() {
  if (!existsSync(DATA_PATH)) mkdirp.sync(DATA_PATH);
}

let jsFiles = [];
const getJSFiles = () => new Promise((resolve, reject) => {
  // Only read the files once 
  if (!jsFiles.length || process.env.NODE_ENV === 'dev') {
    glob('/**/*.js', {
      ignore: [
        '/**/app.js',
      ],
      root: PUBLIC_JS,
    }, (err, filePaths) => {
      if (err) reject(err);
      else {
        jsFiles = filePaths.map(fp => fp.split(PUBLIC_JS).join('/js'));
        log('[LOAD] JS files', `\n - ${jsFiles.join('\n - ')}`);
        resolve(jsFiles);
      }
    });
  }
  else resolve(jsFiles);
});

const configExists = () => existsSync(CONFIG_PATH);

module.exports = function viewMiddleware({ resp }) {
  ensureFolderStructure();
  
  const NEEDS_INITAL_SETUP = !configExists();
  
  Promise.all([
    getJSFiles(),
  ])
    .then(([
      jsFilePaths,
    ]) => {
      resp.end(`
        <html>
          <head>
            <title>Password Manager</title>
            <meta http-equiv="content-type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1 minimum-scale=1">
            
            <link rel="apple-touch-icon" sizes="180x180" href="/imgs/icons/apple-touch-icon.png">
            <link rel="icon" type="image/png" sizes="32x32" href="/imgs/icons/favicon-32x32.png">
            <link rel="icon" type="image/png" sizes="16x16" href="/imgs/icons/favicon-16x16.png">
            <link rel="manifest" href="/imgs/icons/site.webmanifest">
            <link rel="mask-icon" href="/imgs/icons/safari-pinned-tab.svg" color="#000000">
            <link rel="shortcut icon" href="/imgs/icons/favicon.ico">
            <meta name="msapplication-TileColor" content="#ffffff">
            <meta name="msapplication-config" content="/imgs/icons/browserconfig.xml">
            <meta name="theme-color" content="#000000">
            
            <link rel="stylesheet" href="/css/app.css"/>
            ${jsFilePaths.map(s => `<script src="${s}"></script>`).join(`\n\t\t\t`)}
            <script>
              window.NEEDS_INITAL_SETUP = ${NEEDS_INITAL_SETUP};
            </script>
          </head>
          <body>
            <script src="/js/app.js"></script>
          </body>
        </html>
      `);
    })
    .catch((err) => {
      returnErrorResp({ label: 'Failed to render view', resp })(err);
    });
}