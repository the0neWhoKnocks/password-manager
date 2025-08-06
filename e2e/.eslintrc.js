module.exports = {
  extends: [
    'plugin:playwright/recommended',
  ],
  overrides: [
    {
      files: 'tests/**',
    },
  ],
  rules: {
    'playwright/expect-expect': ['error', {
      assertFunctionNames: [
        'deleteCred',
        'verifyAlert',
        'verifyPageTitle',
        'waitForDialog',
      ],
    }],
    'playwright/no-conditional-expect': 'off',
    'playwright/no-conditional-in-test': 'off',
    'playwright/no-nested-step': 'off',
  },
};
