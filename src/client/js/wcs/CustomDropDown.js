(() => {
  const STYLES = `
    *, *::after, *::before {
      box-sizing: border-box;
    }
    
    :host {
      font: 16px Helvetica, Arial, sans-serif;
    }
    
    button {
      font-size: 1em;
      cursor: pointer;
    }
    
    .svg-icon {
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
    
    .drop-down {
      display: inline-block;
      position: relative;
      z-index: 0;
    }
    .drop-down__btn:focus,
    .drop-down:hover > .drop-down__btn {
      color: #fff;
      background: #333;
    }
    .drop-down.open > .drop-down__items {
      display: block;
    }
    
    .drop-down__btn {
      font-weight: bold;
      line-height: 1em;
      padding: 0.5em;
      padding-right: 40px;
      border: none;
      background: transparent;
      display: flex;
      position: relative;
    }
    .drop-down__btn > * {
      user-select: none;
      pointer-events: none;
    }
    .drop-down__btn > .svg-icon {
      position: absolute;
      right: 10px;
    }
    
    .drop-down__items {
      min-width: 100%;
      background-image: linear-gradient(180deg, #949494 0, #dadada 0.5em);
      box-shadow: 0 6px 0.5em 0.1em rgba(0, 0, 0, 0.4);
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      z-index: -1;
    }
    
    slot[name="ddItems"]::slotted(*) {
      white-space: nowrap;
      padding: 0.75em 1em;
      display: block;
    }
    slot[name="ddItems"]::slotted(button) {
      min-width: 100%;
      border: none;
      cursor: pointer;
      background: transparent;
    }
    slot[name="ddItems"]::slotted(button:focus),
    slot[name="ddItems"]::slotted(button:hover) {
      color: #fff;
      background: #333;
    }
    slot[name="ddItems"]::slotted(*:not(:first-child)) {
      border-top: solid 1px #000;
    }
  `;

  class CustomDropDown extends HTMLElement {
    get label() {
      return this.getAttribute('label');
    }
    
    set label(label) {
      this.setAttribute('label', label);
    }
    
    constructor() {
      super();
      
      this.attachShadow({ mode: 'open' });
      
      const { shadowRoot } = this;
      shadowRoot.innerHTML = `
        <style>${STYLES}</style>
        <svg style="display:none; position:absolute" width="0" height="0">
          <symbol viewBox="0 0 1792 1792" id="ui-icon_angle-down" xmlns="http://www.w3.org/2000/svg">
            <path d="M1395 736q0 13-10 23l-466 466q-10 10-23 10t-23-10L407 759q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l393 393 393-393q10-10 23-10t23 10l50 50q10 10 10 23z"></path>
          </symbol>
          <symbol viewBox="0 0 1792 1792" id="ui-icon_angle-left" xmlns="http://www.w3.org/2000/svg">
            <path d="M589 960q0-13 10-23l466-466q10-10 23-10t23 10l50 50q10 10 10 23t-10 23L768 960l393 393q10 10 10 23t-10 23l-50 50q-10 10-23 10t-23-10L599 983q-10-10-10-23z"></path>
          </symbol>
        </svg>
        
        <div class="drop-down">
          <button class="drop-down__btn" type="button">
            ${this.label}
            <svg class="svg-icon">
              <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#ui-icon_angle-down"></use>
            </svg>
          </button>
          <nav class="drop-down__items">
            <slot name="ddItems"></slot>
          </nav>
        </div>
      `;
      
      this.els = {
        btn: shadowRoot.querySelector('.drop-down__btn'),
        dd: shadowRoot.querySelector('.drop-down'),
        ddItems: shadowRoot.querySelector('.drop-down__items'),
      };
      
      this.close = this.close.bind(this);
      this.closeCheck = this.closeCheck.bind(this);
      this.handleToggleClick = this.handleToggleClick.bind(this);
    }
    
    connectedCallback() {
      this.els.btn.addEventListener('click', this.handleToggleClick);
    }
    
    close() {
      this.els.dd.classList.remove('open');
      this.els.ddItems.removeEventListener('click', this.close);
      window.removeEventListener('click', this.closeCheck);
      document.body.removeEventListener('focusin', this.closeCheck);
    }
    
    closeCheck(ev) {
      if (!this.contains(ev.target)) this.close();
    }
    
    handleToggleClick() {
      if (!this.els.dd.classList.contains('open')) {
        this.els.dd.classList.add('open');
        this.els.ddItems.addEventListener('click', this.close);
        window.addEventListener('click', this.closeCheck);
        document.body.addEventListener('focusin', this.closeCheck);
      }
      else this.close();
    }
  }

  window.customElements.define('custom-drop-down', CustomDropDown);
})();
