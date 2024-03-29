(() => {
  const ANIM_DURATION = 300;
  const MODIFIER__CLOSING = 'closing';
  const MODIFIER__HIDE = 'hide';
  const MODIFIER__MODAL = 'is--modal';
  const MODIFIER__SHOW = 'show';
  const BORDER_COLOR = '#000';
  const BODY_COLOR = '#eee';
  const TITLE_BG_COLOR = '#333';
  const TITLE_TEXT_COLOR = '#eee';
  const STYLES = `
    *, *::after, *::before {
      box-sizing: border-box;
    }
    
    :host {
      font: 16px Helvetica, Arial, sans-serif;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      z-index: 10;
    }
    
    button,
    input,
    select,
    textarea {
      font-size: 1em;
    }
    
    button {
      cursor: pointer;
    }
    
    .dialog-mask {
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
      transition: opacity ${ANIM_DURATION}ms
    }
    .dialog-mask.${MODIFIER__SHOW} {
      opacity: 1;
    }
    
    .dialog {
      overflow: hidden;
      padding: 0;
      border: solid 4px var(--dialog-border-color, ${BORDER_COLOR});
      border-radius: 0.5em;
      margin: 0;
      background: var(--dialog-border-color, ${BORDER_COLOR});
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -70%);
      box-shadow: 0 0.75em 2em 0.25em rgba(0, 0, 0, 0.75);
      opacity: 0;
      transition: opacity ${ANIM_DURATION}ms, transform ${ANIM_DURATION}ms;
    }
    .dialog.${MODIFIER__SHOW} {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
    .dialog.${MODIFIER__SHOW}.${MODIFIER__CLOSING} {
      opacity: 0;
      transform: translate(-50%, -30%);
    }
    
    .dialog__nav {
      min-height: 2em;
      font-size: 1.25em;
      border-bottom: solid 1px;
      display: flex;
    }
    
    .dialog__title {
      width: 100%;
      color: var(--dialog-title-text-color, ${TITLE_TEXT_COLOR});
      padding: 0.5em;
      padding-right: 1em;
      background: var(--dialog-title-bg-color, ${TITLE_BG_COLOR});
    }
    
    .dialog__body {
      background: var(--dialog-body-color, ${BODY_COLOR});
    }
    
    .dialog__close-btn {
      color: var(--dialog-title-text-color, ${TITLE_TEXT_COLOR});
      padding: 0 1em;
      border: none;
      background: var(--dialog-title-bg-color, ${TITLE_BG_COLOR});
    }
    .${MODIFIER__MODAL} .dialog__close-btn {
      display: none;
    }
    
    .${MODIFIER__HIDE} {
      display: none;
    }
  `;

  class CustomDialog extends HTMLElement {
    get modal() {
      return this.hasAttribute('modal');
    }
    
    set modal(isModal) {
      if (isModal) {
        this.setAttribute('modal', '');
        this.removeDialogListeners();
        this.els.dialog.classList.add(MODIFIER__MODAL);
      }
      else {
        this.removeAttribute('modal');
        this.addDialogListeners();
        this.els.dialog.classList.remove(MODIFIER__MODAL);
      }
      
      this.displayTitleBar();
    }
    
    set onClose(fn) {
      this._onClose = fn;
    }
    
    get title() {
      return this.getAttribute('title') || '';
    }
    
    set title(title) {
      this.setAttribute('title', title);
      this.els.dialogTitle.innerHTML = title;
      this.displayTitleBar();
    }
    
    displayTitleBar() {
      if (this.modal) this.els.closeBtn.classList.add(MODIFIER__HIDE);
      else this.els.closeBtn.classList.remove(MODIFIER__HIDE);
      
      if (this.modal && !this.title) this.els.dialogNav.classList.add(MODIFIER__HIDE);
      else this.els.dialogNav.classList.remove(MODIFIER__HIDE);
    }
    
    constructor() {
      super();
      
      this.attachShadow({ mode: 'open' });
      
      const { shadowRoot } = this;
      
      shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        
        <div class="dialog-mask"></div>
        <dialog
          class="dialog ${this.modal ? MODIFIER__MODAL : ''}"
          tabindex="0"
          open
        >
          <nav class="dialog__nav">
            <div class="dialog__title">
              <slot name="dialogTitle">${this.title}</slot>
            </div>
            <button type="button" class="dialog__close-btn">&#10005;</button>
          </nav>
          <div class="dialog__body">
            <slot name="dialogBody"></slot>
          </div>
        </dialog>
      `;
      
      this.KEY_CODE__ESC = 27;
      this.ANIM_DURATION = 300;
      this.MODIFIER__CLOSING = MODIFIER__CLOSING;
      this.MODIFIER__HIDE = MODIFIER__HIDE;
      this.MODIFIER__MODAL = MODIFIER__MODAL;
      this.MODIFIER__SHOW = MODIFIER__SHOW;
      
      this.els = {
        closeBtn: shadowRoot.querySelector('.dialog__close-btn'),
        dialog: shadowRoot.querySelector('.dialog'),
        dialogBGMask: shadowRoot.querySelector('.dialog-mask'),
        dialogNav: shadowRoot.querySelector('.dialog__nav'),
        dialogTitle: shadowRoot.querySelector('[name="dialogTitle"]'),
        userStyles: shadowRoot.querySelector('#userStyles'),
      };
      
      this.handleCloseClick = this.handleCloseClick.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleMaskClick = this.handleMaskClick.bind(this);
      
      shadowRoot.querySelector('[name="dialogBody"]').addEventListener('slotchange', () => {
        this.els.dialogBody = this.querySelector('[slot="dialogBody"]');
      });
    }
    
    connectedCallback() {
      window.requestAnimationFrame(() => {
        const visibleInput = this.els.dialogBody && this.els.dialogBody.querySelector('input[type="text"]');
        (visibleInput) ? visibleInput.focus() : this.els.dialog.focus();
      });
    }

    handleCloseClick() { this.close(); }
    handleMaskClick() { this.close(); }
    
    handleKeyDown(ev) {
      if (
        (ev.code === 'Escape')
        || (ev.key === 'Escape')
        || (ev.keyCode === this.KEY_CODE__ESC)
      ) this.close();
    }
    
    addDialogListeners() {
      this.els.closeBtn.addEventListener('click', this.handleCloseClick);
      this.els.dialogBGMask.addEventListener('click', this.handleMaskClick);
      window.addEventListener('keydown', this.handleKeyDown);
    }
    
    removeDialogListeners() {
      this.els.closeBtn.removeEventListener('click', this.handleCloseClick);
      this.els.dialogBGMask.removeEventListener('click', this.handleMaskClick);
      window.removeEventListener('keydown', this.handleKeyDown);
    }
    
    show() {
      window.customDialog = this;
      
      this.displayTitleBar();
      
      if (!this.parentNode) document.body.appendChild(this);
      
      if (!this.modal) this.addDialogListeners();
      
      setTimeout(() => {
        this.els.dialog.classList.add(MODIFIER__SHOW);
        this.els.dialogBGMask.classList.add(MODIFIER__SHOW);
      }, 100);
    }
    
    close() {
      if (!this.modal) this.removeDialogListeners();
      
      this.els.dialog.classList.add(MODIFIER__CLOSING);
      this.els.dialogBGMask.classList.remove(MODIFIER__SHOW);
      
      setTimeout(() => {
        this.els.dialog.classList.remove(MODIFIER__SHOW, MODIFIER__CLOSING);
        
        if (this._onClose) this._onClose();
        delete window.customDialog;
        
        // only remove if not within another Web Component
        if (this.parentNode && this.parentNode.toString() !== "[object ShadowRoot]") this.remove();
      }, ANIM_DURATION);
    }
  }

  window.customElements.define('custom-dialog', CustomDialog);
})();
