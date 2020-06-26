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
      border: none;
      border-radius: 0;
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
    
    nav {
      display: flex;
    }
    nav button:not(:first-of-type) {
      margin-left: 0.75em;
    }
  `;

  class CustomCreateAccountForm extends HTMLElement {
    set onCancelClick(fn) {
      this._onCancelClick = fn;
    }
    
    constructor() {
      super();
      
      this.attachShadow({ mode: 'open' });
      
      const { shadowRoot } = this;
      shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        
        <custom-dialog id="createAccountDialog" modal>
          <form
            slot="dialogBody"
            id="createAccount"
            method="POST"
            action="/api/user/create"
          >
            <div class="hr-with-text">
              <span>Create Account</span>
            </div>
            <label class="input-label">
              Username
              <input type="text" name="username" />
            </label>
            <label class="input-label">
              Password
              <input type="password" name="password" />
            </label>
            <label class="input-label">
              Cipher Key
              <input type="text" name="cipherKey" />
            </label>
            <nav>
              <button type="button" value="cancel">Cancel</button>
              <button value="create">Create</button>
            </nav>
          </form>
        </custom-dialog>
      `;
      
      this.els = {
        dialog: shadowRoot.querySelector('#createAccountDialog'),
        userName: shadowRoot.querySelector('[name="username"]'),
        cancelBtn: shadowRoot.querySelector('[value="cancel"]'),
      };
      
      this.handleCancelClick = this.handleCancelClick.bind(this);
    }
    
    handleCancelClick() {
      if (this._onCancelClick) this._onCancelClick();
    }
    
    show() {
      if (!this.parentNode) document.body.appendChild(this);
      this.els.dialog.show();
      this.els.userName.focus();
      
      this.els.cancelBtn.addEventListener('click', this.handleCancelClick);
    }
    
    close() {
      this.els.cancelBtn.removeEventListener('click', this.handleCancelClick);
      
      this.els.dialog.onClose = () => {
        this.remove();
      };
      this.els.dialog.close();
    }
  }

  window.customElements.define('custom-create-account-form', CustomCreateAccountForm);
})();
