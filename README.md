<h1>
  <img src="./src/client/imgs/icons/android-chrome-192x192.png" height="25" alt="logo"> Password Manager
</h1>

[![Travis (.com) branch](https://img.shields.io/travis/the0neWhoKnocks/password-manager/master?style=for-the-badge)](https://travis-ci.org/github/the0neWhoKnocks/password-manager/builds)
[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/the0neWhoKnocks/password-manager?sort=semver&style=for-the-badge)](https://github.com/the0neWhoKnocks/password-manager/releases)
[![DockerHub](https://img.shields.io/static/v1?label=Docker&message=Hub&color=blue&style=for-the-badge&logo=docker)](https://hub.docker.com/repository/docker/theonewhoknocks/password-manager)
![GitHub](https://img.shields.io/github/license/the0neWhoKnocks/password-manager?color=%237ea01a&style=for-the-badge)
[![Codecov branch](https://img.shields.io/codecov/c/github/the0neWhoKnocks/password-manager/master?style=for-the-badge)](https://codecov.io/gh/the0neWhoKnocks/password-manager/branch/)

A Password Manager designed to be run over your LAN.

---

## Features

- Multiple User accounts
- All sensitive information is encrypted via a User's password so not even the
App's Admin can view the data once it's been saved.
- User's can export/import their data.
- User's can filter down credentials based on label name. If you have a ton of
credentials, this can save you some scrolling.
- User's can choose to hide values on load by adding the `hideValues=true`
query parameter. 

---

## Install

To install in a Dockerized environment, you can utilize the `docker-compose.yml`
file in this repo.

---

## HTTPS

Some experiences will complain if the App isn't run over https. To get that
wired up, follow the below instructions.

- Run `./bin/gen-certs.sh "App Name"`
   - This'll create a `certs.app-name` folder with files like
     ```sh
     /certs.app-name
       app-name.crt
       app-name.key
       app-name-CA.crt
       app-name-CA.key
     ```
- The non-`-CA` files will be used for the App. When starting the App via Node
or Docker, you'll need to set this environment variable
   ```sh
   `NODE_EXTRA_CA_CERTS="$PWD/certs/app-name.crt"`
   ```
   - Note that `$PWD` expands to an absolute file path.
   - The App automatically determines the `.key` file so long as the `.key` & `.crt`
   files have the same name.
- Install the Certificate Authority in **Chrome**:
   - Settings > In the top input, filter by `cert` > Click `Security`
   - Click on `Manage certificates`
   - Go the `Trusted Root Certification Authorities` tab
   - Choose `Import`
   - Find the `certs/app-name-CA.crt` file, and add it.
   - If the cert doesn't seem to be working, try in Incognito first. If it's
   working there, then just restart Chrome to get it to work in non-Incognito.
- Install the Certificate Authority in **Firefox**:
   - Options > In the top input, filter by `cert` > Click `View Certificates...`
   - Go to the `Authorities` tab
   - Click on `Import`
   - Find the `certs/app-name-CA.crt` file, and add it.
   - Check `Trust this CA to identify websites`.
- Install the Certificate Authority on **Android**:
   - Copy the CA `.crt` & `.key` to the device
   - Go to `Settings` > `Security` > Click on `Install from storage`
   - Select the `.crt` file
   - Give it a name

---

## Development

### Installation

```sh
npm i
```

### Run the App

**Via Node**
```sh
npm start
# or for Dev (starts a BrowserSync & Nodemon watcher)
npm run start:dev
```

**Via Docker**
```sh
docker-compose up
```

### Testing

Running Unit tests
```sh
npm run test
# or to test individual file(s)
npm run test:watch <regex>
```

### Debugging the App

To see more info about what's going on in the Server you can add this query param
```
?debug=*
```
After you refresh the page you'll see more logging prefixed with `passman`. If
there's a particular area you want to focus on, you just have to update the
param to a log suffix value. So if you see a log like `passman:view`, you just
have to update the param to:
```
?debug=view
```

---

## Releasing

1. Prep the repo
   - Ensure the info in `./bin/releaseConfig.sh` is correct for your repo.
   - Create a `CHANGELOG.md` if one does not already exist. The contents should
   be this.
      ```md
      # Changelog
      ---

      ```
1. Run `./bin/release.sh` and follow the steps.
   - To skip having to enter a Docker password every time, create a
   `.dockercreds` file in the same directory as `release.sh` and put your
   password in there.
   - In order to automatically convert git tags to actual releases you'll need
   to generate a [Personal Access Token](https://github.com/settings/tokens),
   and add it to your global git config `git config --global github.token <YOUR_TOKEN>`.

If something happens during the final stage of the release, you'll have to
manually reset some things.
```sh
# Reset the last commit
git reset --soft HEAD~1
# Verify that just release files will be reset. You should just see:
# - `CHANGELOG.md`
# - `package-lock.json`
# - `package.json`
git status
# If the above is good, unstage those changes
git reset
# Reset changed files
git checkout -- CHANGELOG.md package.json package-lock.json
# Check if a git tag was created
git tag | cat
# If so, remove it
git tag -d <TAG_NAME>
```
