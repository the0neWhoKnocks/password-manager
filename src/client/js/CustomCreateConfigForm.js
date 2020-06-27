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

  class CustomCreateConfigForm extends HTMLElement {
    get action() {
      return this.getAttribute('action');
    }

    set action(_action) {
      this.els.form.setAttribute('action', _action);
    }
    
    constructor() {
      super();
      
      this.attachShadow({ mode: 'open' });
      
      const { shadowRoot } = this;
      shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        
        <custom-dialog id="createConfigDialog" modal>
          <form
            slot="dialogBody"
            id="createConfig"
            method="POST"
            action="${this.action}"
            autocomplete="off"
          >
            <div class="hr-with-text">
              <span>Create Config</span>
            </div>
            <p>
              Looks like this is your first time running this App, so let's set
              some things up.
            </p>
            <label class="input-label">
              Cipher Key
              <input type="text" name="cipherKey" placeholder="word or phrase" required />
              <p class="help-text">
                The Cipher Key is a unique value used for some top-level
                encryption operations of the App.
              </p>
            </label>
            <label class="input-label">
              Salt
              <input type="text" name="salt" placeholder="word or phrase" required />
              <p class="help-text">
                The Salt is a unique value that will be used to randomize
                encrypted values.
              </p>
            </label>
            <button value="create">Create</button>
          </form>
        </custom-dialog>
      `;
      
      this.els = {
        cipherKey: shadowRoot.querySelector('[value="cipherKey"]'),
        dialog: shadowRoot.querySelector('#createConfigDialog'),
        form: shadowRoot.querySelector('#createConfig'),
      };
      
      this.handleSubmit = this.handleSubmit.bind(this);
    }
    
    handleSubmit(ev) {
      ev.preventDefault();
      
      const form = ev.currentTarget;
      
      window.utils.postData(form.action, form)
        .then(() => { window.location.reload(); })
        .catch(({ error }) => { alert(error); });
    }
    
    show() {
      if (!this.parentNode) document.body.appendChild(this);
      this.els.dialog.show();
      this.els.form.querySelector('input:first-of-type').focus();
      
      this.els.form.addEventListener('submit', this.handleSubmit);
    }
    
    close() {
      this.els.form.removeEventListener('submit', this.handleSubmit);
      
      this.els.dialog.onClose = this.remove;
      this.els.dialog.close();
    }
  }

  window.customElements.define('custom-create-config-form', CustomCreateConfigForm);
})();
