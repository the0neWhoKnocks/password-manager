(() => {
  const STYLES = `
    *, *::after, *::before {
      box-sizing: border-box;
    }
    
    :host {
      font: 16px Helvetica, Arial, sans-serif;
    }
    
    button,
    input {
      font-size: 1em;
    }
    
    button {
      color: #fff;
      width: 100%;
      padding: 0.75em 1em;
      border: solid 1px;
      border-radius: 0.25em;
      background: #000;
      cursor: pointer;
    }
    
    label {
      display: block;
    }
    
    form {
      padding: 1em;
      margin: 0;
    }
    form > *:not(:last-child) {
      margin-bottom: 1em;
    }
    
    .hr-with-text {
      font-weight: bold;
      text-align: center;
      position: relative;
    }
    .hr-with-text::before {
      content: '';
      width: 100%;
      height: 1px;
      background: currentColor;
      position: absolute;
      top: 50%;
      left: 0;
      z-index: -1;
    }
    .hr-with-text > * {
      padding: 0 1em;
      background: #eeeeee;
    }
    
    .input-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .input-label input {
      padding: 0.5em;
      margin-left: 0.5em;
    }
    
    .remember-me {
      text-align: right;
      user-select: none;
    }
  `;

  class CustomLoginForm extends HTMLElement {
    set onCreateClick(fn) {
      this._onCreateClick = fn;
    }
    
    set password(password) {
      this.els.password.value = password;
    }
    
    set username(username) {
      this.els.username.value = username;
    }
    
    constructor() {
      super();
      
      this.attachShadow({ mode: 'open' });
      
      const { shadowRoot } = this;
      shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        
        <custom-dialog id="loginDialog" modal>
          <form
            slot="dialogBody"
            id="loginForm"
            method="POST"
            action="/api/user/login"
            autocomplete="off"
            spellcheck="false"
          >
            <div class="hr-with-text">
              <span>Log In</span>
            </div>
            <label class="input-label">
              Username
              <input type="text" name="username" required />
            </label>
            <label class="input-label">
              Password
              <input type="password" name="password" required />
            </label>
            <label class="remember-me">
              <input type="checkbox" />
              Remember Me
            </label>
            <button value="login">Log In</button>
            <div class="hr-with-text">
              <span>or</span>
            </div>
            <button type="button" value="create">Create Account</button>
          </form>
        </custom-dialog>
      `;
      
      this.els = {
        dialog: shadowRoot.querySelector('#loginDialog'),
        createAccountBtn: shadowRoot.querySelector('[value="create"]'),
        password: shadowRoot.querySelector('[name="password"]'),
        username: shadowRoot.querySelector('[name="username"]'),
      };
      
      this.handleCreateClick = this.handleCreateClick.bind(this);
    }
    
    handleCreateClick() {
      if (this._onCreateClick) this._onCreateClick();
    }
    
    show() {
      if (!this.parentNode) document.body.appendChild(this);
      this.els.dialog.show();
      this.els.username.focus();
      
      this.els.createAccountBtn.addEventListener('click', this.handleCreateClick);
    }
    
    close() {
      this.els.createAccountBtn.removeEventListener('click', this.handleCreateClick);
      
      this.els.dialog.onClose = () => {
        this.remove();
      };
      this.els.dialog.close();
    }
  }

  window.customElements.define('custom-login-form', CustomLoginForm);
})();
