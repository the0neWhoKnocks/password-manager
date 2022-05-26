const TOP_NAV = '.credentials__top-nav';
const TOP_NAV__CREDS = `${TOP_NAV} custom-drop-down[label="Credentials"]`;
const TOP_NAV__USER = `${TOP_NAV} custom-drop-down[label="User"]`;

export default {
  CRED_CARD: '.credentials-card',
  FORM__CREDS: '.creds-form',
  FORM__CREATE_ACCOUNT: '#createAccount',
  FORM__INPUT_CREATOR: '.input-creator-form',
  FORM__LOGIN: '#loginForm',
  MSG__NO_CREDS: '.no-creds-msg',
  PROGRESS_INDICATOR: '.load-progress-indicator',
  TOP_NAV__CREDS,
  TOP_NAV__CREDS__ADD: `${TOP_NAV__CREDS} #addCreds`,
  TOP_NAV__CREDS__EXPORT: `${TOP_NAV__CREDS} #exportCreds`,
  TOP_NAV__CREDS__IMPORT: `${TOP_NAV__CREDS} #importCreds`,
  TOP_NAV__USER,
  TOP_NAV__USER__DELETE: `${TOP_NAV__USER} #deleteUser`,
  TOP_NAV__USER__LOGOUT: `${TOP_NAV__USER} #logout`,
  TOP_NAV__USER__UPDATE: `${TOP_NAV__USER} #updateUser`,
};