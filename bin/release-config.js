const { resolve } = require('path');

module.exports = {
  // URL that the App will be available at once started.
  APP__TEST_URL: 'http://localhost:3000',
  // Command to build specific or all Docker containers
  CMD__DOCKER_BUILD: 'docker-compose build',
  // Command to start the built Container(s), so a Dev can verify before it's deployed
  CMD__DOCKER_START: 'docker-compose up -d',
  // Command to compile any assets that may be needed by Docker, shipped off to S3, etc.
  // CMD__COMPILE_ASSETS: 'npm run compile',
  // Name of the Docker image: <DOCKER_USER>/<NAME>
  DOCKER__IMG_NAME: 'theonewhoknocks/password-manager',
  // An absolute path to a file containing a DockerHub username & password
  PATH__CREDS__DOCKER: resolve(__dirname, '.creds-docker'),
  // An absolute path to the root of your repo
  PATH__REPO_ROOT: resolve(__dirname, '../'),
};
