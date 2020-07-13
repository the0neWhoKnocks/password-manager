# Changelog
---

## v1.4.1

**Bugfixes**
- [2781962](https://github.com/the0neWhoKnocks/password-manager/commit/2781962) - Tag and Release text don't match CHANGELOG

---

## v1.4.0

**Features**
- [63a7c29](https://github.com/the0neWhoKnocks/password-manager/commit/63a7c29) - Hide values on load
- [abdb057](https://github.com/the0neWhoKnocks/password-manager/commit/abdb057) - Better Docker caching by removing devDependencies from package.json
- [9f48fd8](https://github.com/the0neWhoKnocks/password-manager/commit/9f48fd8) - Added pre-install script to ensure the proper Node/Yarn version

**Bugfixes**
- [1d7f66f](https://github.com/the0neWhoKnocks/password-manager/commit/1d7f66f) - Dockerfile not running preinstall script

**Misc. Tasks**
- [e4889a1](https://github.com/the0neWhoKnocks/password-manager/commit/e4889a1) - Run tests if they exist before releasing
- [1fc4df1](https://github.com/the0neWhoKnocks/password-manager/commit/1fc4df1) - Categorize commits in CHANGELOG
- [fefbb04](https://github.com/the0neWhoKnocks/password-manager/commit/fefbb04) - Cleaned up command to get VERSION
- [b9bae66](https://github.com/the0neWhoKnocks/password-manager/commit/b9bae66) - Ignore test `reports` folder
- [5f2b2d3](https://github.com/the0neWhoKnocks/password-manager/commit/5f2b2d3) - Added logo to README

---

## v1.3.0

- [7f316b3](https://github.com/the0neWhoKnocks/password-manager/commit/7f316b3) feat: Animate Import/Load progress indicator
- [fd9b9d4](https://github.com/the0neWhoKnocks/password-manager/commit/fd9b9d4) chore: Normalize how stream progress is rendered
- [f790848](https://github.com/the0neWhoKnocks/password-manager/commit/f790848) feat: Stream progress on Import like Load is doing
- [042f744](https://github.com/the0neWhoKnocks/password-manager/commit/042f744) feat: Added ability to enable or disable Server logging via URL param
- [ad6de73](https://github.com/the0neWhoKnocks/password-manager/commit/ad6de73) feat: Allow for tracking progress when using `postData`
- [911bd06](https://github.com/the0neWhoKnocks/password-manager/commit/911bd06) chore: Renamed `request` util to `postData`
- [0fa392c](https://github.com/the0neWhoKnocks/password-manager/commit/0fa392c) feat: Sped up decryption on load
- [d0a74af](https://github.com/the0neWhoKnocks/password-manager/commit/d0a74af) feat: Streaming data on load
- [e272f58](https://github.com/the0neWhoKnocks/password-manager/commit/e272f58) fix: Last deletion not resting view & import load indicator
- [4525e20](https://github.com/the0neWhoKnocks/password-manager/commit/4525e20) feat: Create a more accessible title for copyable Card values
- [e8ddf8e](https://github.com/the0neWhoKnocks/password-manager/commit/e8ddf8e) feat: Change input to type `email` in Add Creds

---

## v1.2.0

- [019c3cd](https://github.com/the0neWhoKnocks/password-manager/commit/019c3cd) feat: Make dropdown menus work on touch devices
- [b80595e](https://github.com/the0neWhoKnocks/password-manager/commit/b80595e) feat: Ensure Filter input styling is the same everywhere
- [615c0e9](https://github.com/the0neWhoKnocks/password-manager/commit/615c0e9) feat: On Add, Update, & Delete - Don't reload all credentials
- [e12eaef](https://github.com/the0neWhoKnocks/password-manager/commit/e12eaef) feat: Focus input on Add Custom Field reveal
- [19e3b04](https://github.com/the0neWhoKnocks/password-manager/commit/19e3b04) feat: Add Creds inputs are now monospace
- [2280b2a](https://github.com/the0neWhoKnocks/password-manager/commit/2280b2a) fix: Updates & Deletions executing on the wrong node
- [345df95](https://github.com/the0neWhoKnocks/password-manager/commit/345df95) Redesigned the Card
- [73230c7](https://github.com/the0neWhoKnocks/password-manager/commit/73230c7) Added TODOs

---

## v1.1.3

- [323bac5](https://github.com/the0neWhoKnocks/password-manager/commit/323bac5) Docker cache now won't bust on non-dependencies changes

---

## v1.1.2

- [73be43e](https://github.com/the0neWhoKnocks/password-manager/commit/73be43e) Updated GH release API request

---

## v1.1.1

- [a27e880](https://github.com/the0neWhoKnocks/password-manager/commit/a27e880) Patched GH release code

---

## v1.1.0

- [5b078b5](https://github.com/the0neWhoKnocks/password-manager/commit/5b078b5) Updated Docker caching strategy
- [4b87470](https://github.com/the0neWhoKnocks/password-manager/commit/4b87470) Added icons
- [ff1a261](https://github.com/the0neWhoKnocks/password-manager/commit/ff1a261) Updated README
- [bee1592](https://github.com/the0neWhoKnocks/password-manager/commit/bee1592) Updated README
- [983eeec](https://github.com/the0neWhoKnocks/password-manager/commit/983eeec) A GitHub release will now be created while releasing

---
