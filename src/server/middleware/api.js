const { existsSync } = require('fs');
const crypto = require('crypto');
const auth = require('authenticator');
const mkdirp = require('mkdirp');
const parseReq = require('../utils/parseReq');
const { DATA_PATH } = require('../../constants');

const SALT = process.env.SALT || '1337haxor';

function ensureFolderStructure() {
  if (!existsSync(DATA_PATH)) mkdirp.sync(DATA_PATH);
}

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

const decrypt = (cipherKey, value) => new Promise((res) => {
  const key = crypto.scryptSync(cipherKey, SALT, 24);
  const [ivHex, encryptedHex] = value.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  res(decrypted.toString());
});

const returnResp = ({ data, label, prefix = '', res }) => {
  if (!res) throw Error('Missing `res`');
  else {
    console.log(`[${prefix.toUpperCase()}] ${label}`);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data || {}));
  }
};

const returnErrorResp = ({ label, res }) => (err) => {
  if (!res) throw Error('Missing `res`');
  else {
    let errMsg = err;
    res.statusCode = 500;
    res.statusMessage = 'Server Error';
    
    if (err instanceof Error) {
      console.log(`[ERROR] ${label}:`, err);
      errMsg = err.stack;
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: `${errMsg}` }));
  }
};

function createUser({ req, res }) {
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
        //   res,
        // });
      }
    })
    .catch(returnErrorResp({ label: 'Gen Token request parse failed', res }));
}

// function login({ req, res }) {
//   auth.verifyToken(formattedKey, formattedToken);
// }

module.exports = function apiMiddleware({ req, res, urlPath }) {
  if (urlPath.startsWith('/api')) {
    ensureFolderStructure();
    
    if (urlPath.endsWith('/user/create')) createUser({ req, res });
    else if (urlPath.endsWith('/user/gen-token')) genToken({ req, res });
    // else if (urlPath.endsWith('/user/login')) login({ req, res });
  }
}