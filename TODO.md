# TODO

- [x] Labels & values don't always fit in Card
- [ ] Maybe stream load?
  - Have some sort of "Decrypting Data" message on load. Possibly return the
  percentage of items that have completed
  - https://stackoverflow.com/questions/46145738/stream-response-into-http-response
  - https://stackoverflow.com/questions/11906198/node-js-write-http-response-to-stream
- [ ] On Add of a cred, don't load all creds again, just append to the current
list of items.
- [x] On Add Custom Field, focus the input
- [ ] Cancel load request if another request is made? Or batch, and do one at a time.
- [x] Make Add Creds inputs `monospace`
- [ ] On a touch device, clicking on Credentials > Add, the menu doesn't close in the BG when the Dialog opens.
- [x] Updating and deleting a credential is executing on the incorrect nodes
  - It looks like it's related to the `credsNdx`. It may be incorrect after the
  sort of all the items occurs.

- Start form
  - [x] + Create Account (button)
    - Inputs: Username, Password, Cipher Key (unique value that all credentials will be encoded with)
  - [x] Login (button)
    - Inputs: Username, Password
    - Checkbox: Remember Me
      - [x] ‎When checked, use `localStorage`, else, use `sessionStorage`
  - [x] Have 2 vault doors in the BG, list will load behind them after login, then doors will open 
- Once logged in
  - Nav
    - + Add Credentials (button)
      - [x] Base inputs: Label, Website, Email, Username, Password
      - [x] + Add Custom (button): Allows User to add in custom fields
      - [ ] If a Website is provided, try to go scrape the site's favicon
      - [ ] Display a preview of the credentials below the inputs
      - ‎[x] Store all data in a JSON file. Each entry, UID with encoded Object of all entry data. When the User exports, it decodes everything. 
    - [x] Export Credentials (button): exports JSON with basic info that User entered, nothing specific to the App
      - Saves a JSON with an `app` & `creds` node.
        ```
        {
          app: {
            schema: 1.0,
            user: {
              username: '',
              password: '',
            },
          },
          creds: [],  
        }
        ```
    - [x] Import Credentials (button): exports JSON with basic info that User entered, nothing specific to the App
      - Endpoint will have to batch process the creds
    - [x] Log Out
    - [x] Delete Account
    - [x] Update Profile
      - If `username` changes, `users.json` needs to update
      - If `password` changes, `creds_<uid>.json` & `users.json` needs to update.
        - Get all un-encoded data, then re-encode with new `password`.
        - `creds_` file would have to be renamed. Probably just easier to delete the old file.
      - Update current `storage` data... or just log them out and have them log back in.
  - [x] A fuzzy Search bar, allowing a User to filter credentials down.
  - List of credentials
    - [ ] List item contains icon & label
    - [ ] Credential item (popup once user clicks on list item)
      - label as title
      - All input values from Add Credentials step
    - [x] Group creds under first label letter. Have a visual indicator of this
      ```
      - A ----------------
      <card>
      <card>
      - B ----------------
      <card>
      ```
- [x] Runs in Docker
- [x]‎`data` folder contains:
  - ‎`users.json`
    - ‎A User's UID will be based on a combination of their username and password
  - ‎`credentials.<USER_UID>.json`
- [x] Icon: Lock with asterisk (star used for password obfuscation) for hole
- [ ] Clean up duplication in API
- [x] Make version changes to package.json not bust Docker cache
