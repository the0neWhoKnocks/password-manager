module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  ignorePatterns: [
    '/bin/release.js',
  ],
  parserOptions: {
    ecmaVersion: 2019,
  },
  rules: {
    'require-atomic-updates': 'off',
  }
};
