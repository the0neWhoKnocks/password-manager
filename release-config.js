module.exports = {
  version: 1,
  // URL that the App will be available at once started.
  APP__TEST_URL: 'https://localhost:3000',
  // Command to build specific or all Docker containers.
  CMD__DOCKER_BUILD: 'docker compose build password-manager',
  // Command to start the built Container(s), so a Dev can verify before it's deployed.
  CMD__DOCKER_START: 'docker compose up -d password-manager',
  // Name of the Docker image: <DOCKER_USER>/<NAME>.
  DOCKER__IMG_NAME: 'theonewhoknocks/password-manager',
  // When the registry domain is blank, it defaults to `docker.io`.
  DOCKER__REGISTRY_DOMAIN: '',
  // Optional when `REPO__HOST` is `github`, otherwise required. Something like `https://<HOSTNAME>/api/v1`.
  REPO__API_URL: '',
  // Where your repo is hosted. (Supported: github, gitea)
  REPO__HOST: 'github',
};
