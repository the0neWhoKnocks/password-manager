const { existsSync } = require('fs');
const glob = require('glob');
const mkdirp = require('mkdirp');
const returnErrorResp = require('../utils/returnErrorResp');
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