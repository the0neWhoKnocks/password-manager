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
      max-width: 340px;
      padding: 1em;
      margin: 0;
    }
    form > *:not(:last-child) {
      margin-bottom: 1em;
    }
    
    nav {
      display: flex;
    }
    nav button:not(:first-of-type) {
      margin-left: 0.75em;
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
      flex-wrap: wrap;
    }
    .input-label input {
      padding: 0.5em;
      margin-left: 0.5em;
    }
    
    .help-text {
      color: rgba(0 ,0, 0, 0.5);
      font-size: 0.75em;
      margin: 0.5em 0;
    }
  `;

  class CustomCreateAccountForm extends HTMLElement {
    get action() {
      return this.getAttribute('action');
    }

    set action(_action) {
      this.els.form.setAttribute('action', _action);
    }
    
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
            action="${this.action}"
          >
            <div class="hr-with-text">
              <span>Create Account</span>
            </div>
            <label class="input-label">
              Username
              <input type="text" name="username" required />
            </label>
            <label class="input-label">
              Cipher Key
              <input type="text" name="cipherKey" required />
              <p class="help-text">
                Your Cipher Key is a unique value known only to you, and will
                be used to encode all your data.
              </p>
            </label>
            <nav>
              <button type="button" value="cancel">Cancel</button>
              <button value="create">Create</button>
            </nav>
          </form>
        </custom-dialog>
      `;
      
      this.els = {
        cancelBtn: shadowRoot.querySelector('[value="cancel"]'),
        cipherKey: shadowRoot.querySelector('[value="cipherKey"]'),
        dialog: shadowRoot.querySelector('#createAccountDialog'),
        form: shadowRoot.querySelector('#createAccount'),
        username: shadowRoot.querySelector('[name="username"]'),
      };
      
      this.handleCancelClick = this.handleCancelClick.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
    
    handleCancelClick() {
      if (this._onCancelClick) this._onCancelClick();
    }
    
    handleSubmit(ev) {
      ev.preventDefault();
      
      const form = ev.currentTarget;
      
      window.utils.postData(form.action, form)
        .then(({ authKey }) => {
          console.log(authKey);
        })
        .catch(({ error }) => { alert(error); });
    }
    
    show() {
      if (!this.parentNode) document.body.appendChild(this);
      this.els.dialog.show();
      this.els.username.focus();
      
      this.els.cancelBtn.addEventListener('click', this.handleCancelClick);
      this.els.form.addEventListener('submit', this.handleSubmit);
    }
    
    close() {
      this.els.cancelBtn.removeEventListener('click', this.handleCancelClick);
      this.els.form.removeEventListener('submit', this.handleSubmit);
      
      this.els.dialog.onClose = () => {
        this.remove();
      };
      this.els.dialog.close();
    }
  }

  window.customElements.define('custom-create-account-form', CustomCreateAccountForm);
})();
