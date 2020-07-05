# TODO

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
      - [ ] Base inputs: Label, Website, Email, Username, Password
      - [ ] + Add Custom (button): Allows User to add in custom fields
      - [ ] If a Website is provided, try to go scrape the site's favicon
      - [ ] Display a preview of the credentials below the inputs
      - ‎[ ] Store all data in a JSON file. Each entry, UID with encoded Object of all entry data. When the User exports, it decodes everything. 
    - [ ] Export Credentials (button): exports JSON with basic info that User entered, nothing specific to the App
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
    - [ ] Import Credentials (button): exports JSON with basic info that User entered, nothing specific to the App
      - Endpoint will have to batch process the creds
    - [ ] Log Out
    - [ ] Delete Account
  - [ ] A fuzzy Search bar, allowing a User to filter credentials down.
  - List of credentials
    - [ ] List item contains icon & label
    - [ ] Credential item (popup once user clicks on list item)
      - label as title
      - All input values from Add Credentials step
    - [ ] Group creds under first label letter. Have a visual indicator of this
      ```
      - A ----------------
      <card>
      <card>
      - B ----------------
      <card>
      ```
- [ ] Runs in Docker
- [ ]‎`data` folder contains:
  - ‎`users.json`
    - ‎A User's UID will be based on a combination of their username and password
  - ‎`credentials.<USER_UID>.json`
- [ ] Icon: Lock with asterisk (star used for password obfuscation) for hole

Inspiration: https://github.com/hasukmistry/passman
