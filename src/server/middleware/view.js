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

const getJSFiles = () => new Promise((resolve, reject) => {
  // Only read the files once 
  if (!viewMiddleware.jsFiles.length || process.env.NODE_ENV === 'dev') {
    glob('/**/*.js', {
      ignore: [
        '/**/app.js',
        '/**/*.test.js',
      ],
      root: PUBLIC_JS,
    }, (err, filePaths) => {
      if (err) reject(err);
      else {
        viewMiddleware.jsFiles = filePaths.map(fp => fp.split(PUBLIC_JS).join('/js'));
        log('[LOAD] JS files', `\n - ${viewMiddleware.jsFiles.join('\n - ')}`);
        resolve(viewMiddleware.jsFiles);
      }
    });
  }
  else resolve(viewMiddleware.jsFiles);
});

const configExists = () => existsSync(CONFIG_PATH);

function viewMiddleware({ resp }) {
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
            <style>
              .svg-icon { width: 1em; height: 1em; fill: currentColor; }
            </style>
            <svg style="display:none; position:absolute" width="0" height="0">
              <symbol viewBox="0 0 24 24" id="delete" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 16.084L16.097 17.5l-4.09-4.096L7.905 17.5 6.5 16.095l4.093-4.092L6.5 7.905 7.905 6.5l4.088 4.089L16.084 6.5 17.5 7.903l-4.092 4.087 4.092 4.094z"/>
              </symbol>
              <svg viewBox="0 0 32.275391 30.46875" id="asterisk" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 14.355469l2.2460938-6.933594c5.1757707 1.8229802 8.9355322 3.401755 11.2792972 4.736328C12.906885 6.2663426 12.581365 2.2136123 12.548828 0h7.080078c-.09768 3.2227258-.472027 7.2591801-1.123047 12.109375 3.35284-1.692646 7.193982-3.2551444 11.523438-4.6875l2.246094 6.933594c-4.134146 1.367244-8.186877 2.278702-12.158204 2.734375 1.985652 1.725314 4.785129 4.801483 8.398438 9.228515L22.65625 30.46875c-1.888045-2.57157-4.11786-6.070915-6.689453-10.498047-2.408871 4.589892-4.524754 8.089238-6.3476564 10.498047l-5.7617187-4.150391c3.7760309-4.654896 6.4778511-7.731065 8.1054691-9.228515C7.763661 16.276098 3.7760348 15.364641 0 14.355469" font-family="arial" font-size="100"/>
              </svg>
            </svg>
            
            <script src="/js/app.js"></script>
          </body>
        </html>
      `);
    })
    .catch((err) => {
      returnErrorResp({ label: 'Failed to render view', resp })(err);
    });
}
viewMiddleware.jsFiles = [];

module.exports = viewMiddleware;
