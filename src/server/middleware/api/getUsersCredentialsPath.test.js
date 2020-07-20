const { DATA_PATH } = require('../../../constants');
const getUsersCredentialsPath = require('./getUsersCredentialsPath');

describe('getUsersCredentialsPath', () => {
  const encryptedUsername = 'a9s7df9a8s7df98as7df9a8s7d9f8as7df';
  
  it('should return the path of the current Users data', () => {
    expect(getUsersCredentialsPath(encryptedUsername))
      .toBe(`${DATA_PATH}/creds_${encryptedUsername}.json`);
  });
});
