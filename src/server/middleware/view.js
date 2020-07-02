const { existsSync } = require('fs');
const mkdirp = require('mkdirp');
const {
  CONFIG_PATH,
  DATA_PATH,
} = require('../../constants');

function ensureFolderStructure() {
  if (!existsSync(DATA_PATH)) mkdirp.sync(DATA_PATH);
}

const configExists = () => existsSync(CONFIG_PATH);

module.exports = function viewMiddleware({ resp }) {
  ensureFolderStructure();
  
  const NEEDS_INITAL_SETUP = !configExists();
  const headScripts = [
    '/js/serializeForm.js',
    '/js/request.js',
    '/js/storage.js',
    '/js/CustomDialog.js',
    '/js/CustomDropDown.js',
  ];
  
  resp.end(`
    <html>
      <head>
        <title>Password Manager</title>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1 minimum-scale=1">
        
        <link rel="stylesheet" href="/css/app.css"/>
        ${headScripts.map(s => `<script src="${s}"></script>`).join(`\n\t\t\t\t`)}
        <script>
          window.NEEDS_INITAL_SETUP = ${NEEDS_INITAL_SETUP};
        </script>
      </head>
      <body>
        <script src="/js/app.js"></script>
      </body>
    </html>
  `);
}