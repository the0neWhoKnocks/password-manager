const { existsSync, readFile, writeFile } = require('fs');
const crypto = require('crypto');
const auth = require('authenticator');
const parseReq = require('../utils/parseReq');
const returnErrorResp = require('../utils/returnErrorResp');
const returnResp = require('../utils/returnResp');
const { CONFIG_PATH, DATA_PATH } = require('../../constants');

const SALT = process.env.SALT || '1337haxor';



const encrypt = (cipherKey, value) => new Promise((res) => {
  const key = crypto.scryptSync(cipherKey, SALT, 24);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value),
    cipher.final()
  ]);

  res(`${iv.toString('hex')}:${encrypted.toString('hex')}`);
});

const decrypt = (cipherKey, value) => new Promise((resolve) => {
  const key = crypto.scryptSync(cipherKey, SALT, 24);
  const [ivHex, encryptedHex] = value.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  resolve(decrypted.toString());
});

  }

function createUser({ req, res }) {
function createUser({ req, resp }) {
  parseReq(req)
    .then(({ cipherKey, username }) => {
      if (!cipherKey || !username) {
        returnErrorResp({ res })(
          `Looks like you're missing some data.\n  Username: "${username}"\n  Cipher Key: "${cipherKey}"`
        );
      }
      else {
        const authKey = auth.generateKey();
        
        encrypt(cipherKey, username).then((encrypted) => {
          // TODO - the decrypt is temporary, just fleshing things out
          console.log('encrypted', encrypted)
          decrypt(cipherKey, encrypted).then((decrypted) => {
            console.log('decrypted', decrypted)
            
            returnResp({
              data: { authKey },
              label: `User for "${username}"`,
              prefix: 'created',
              res,
            });
          });
        });
      }
    })
    .catch(returnErrorResp({ label: 'Create User request parse failed', res }));
}

function genToken({ req, res }) {
  parseReq(req)
    .then(({ username }) => {
      if (!username) {
        returnErrorResp({ res })(
          `Looks like you're missing some data.\n  Username: "${username}"`
        );
      }
      else {
        // TODO - see if the user exists, if so, generate token from their authKey
        // const token = auth.generateToken(authKey); 
        // 
        // returnResp({
        //   data: { authKey },
        //   label: `User for "${username}"`,
        //   prefix: 'created',
        //   resp,
        // });
      }
    })
    .catch(returnErrorResp({ label: 'Gen Token request parse failed', resp }));
}

// function login({ req, resp }) {
//   auth.verifyToken(formattedKey, formattedToken);
// }

function createConfig({ req, resp }) {
  parseReq(req)
    .then(({ cipherKey, salt }) => {
      if (!cipherKey || !salt) {
        returnErrorResp({ resp })(
          `Looks like you're missing some data.\n  Cipher Key: "${cipherKey}"\n  Salt: "${salt}"`
        );
      }
      else {
        writeFile(CONFIG_PATH, JSON.stringify({ cipherKey, salt }), 'utf8', (err) => {
          if (err) returnErrorResp({ label: 'Create Config write failed', resp });
          else returnResp({ label: 'Config', prefix: 'created', resp });
        });
      }
    })
    .catch(returnErrorResp({ label: 'Create Config request parse failed', resp }));
}

module.exports = function apiMiddleware({ req, resp, urlPath }) {
  if (urlPath.startsWith('/api')) {
    resp.preparingAsyncResponse();
    
    if (urlPath.endsWith('/config/create')) createConfig({ req, resp });
    else if (urlPath.endsWith('/user/create')) createUser({ req, resp });
    else if (urlPath.endsWith('/user/gen-token')) genToken({ req, resp });
    // else if (urlPath.endsWith('/user/login')) login({ req, resp });
    else returnErrorResp({ resp })(`The endpoint "${urlPath}" does not exist`);
  }
}