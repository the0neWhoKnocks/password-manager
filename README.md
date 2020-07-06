# Password Manager

![GitHub](https://img.shields.io/github/license/the0neWhoKnocks/password-manager?color=%237ea01a&style=for-the-badge)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/the0neWhoKnocks/password-manager?sort=semver&style=for-the-badge)
[![DockerHub](https://img.shields.io/static/v1?label=Docker&message=Hub&color=blue&style=for-the-badge&logo=docker)](https://hub.docker.com/repository/docker/theonewhoknocks/password-manager)

A Password Manager designed to be run over your LAN.

---

## Features

- Multiple User accounts
- All sensitive information is encrypted via a User's password so not even the
App's Admin can view the data once it's been saved.
- User's can export/import their data.
- User's can filter down credentials based on label name. If you have a ton of
credentials, this can save you some scrolling.

---

## Development

### Installation

```sh
npm i
```

### Run the App

```sh
npm start
# or for Dev (starts a BrowserSync & Nodemon watcher)
npm run start:dev
```

---

## Releasing

1. Ensure the info in `./bin/releaseConfig.sh` is correct for your repo.
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
