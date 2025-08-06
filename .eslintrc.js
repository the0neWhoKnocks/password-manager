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
    ecmaVersion: 2024,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': ['error', {
      args: 'after-used',
      argsIgnorePattern: "^_$",
    }],
    'require-atomic-updates': 'off',
  }
};
