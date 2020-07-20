const defineSpy = jest.spyOn(window.customElements, 'define');
let rAF;
window.requestAnimationFrame = jest.fn((cb) => { rAF = cb; });

require('./CustomDialog');

jest.useFakeTimers();

class MockWC extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const { shadowRoot } = this;
    shadowRoot.innerHTML = `
      <custom-dialog></custom-dialog>
    `;
  }
}
window.customElements.define('custom-wc', MockWC);

describe('CustomDialog', () => {
  let dialog;
  
  it('should define the custom Dialog', () => {
    expect(defineSpy).toHaveBeenCalledWith('custom-dialog', expect.any(Function));
  });
  
  it("should apply modifiers based on initial attributes", () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <custom-dialog modal></custom-dialog>
    `;
    dialog = div.querySelector('custom-dialog');
    
    expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__MODAL)).toBe(true);
  });
  
  it("should hide the nav if there's no content in it", () => {
    dialog = document.createElement('custom-dialog');
    dialog.innerHTML = 'World';
    dialog.modal = true;
    dialog.show();
    
    expect(dialog.els.dialogNav.classList.contains(dialog.MODIFIER__HIDE)).toBe(true);
  });
  
  it("should NOT hide the nav if there's content in it", () => {
    dialog = document.createElement('custom-dialog');
    dialog.title = 'Hello';
    dialog.innerHTML = 'World';
    dialog.modal = true;
    dialog.show();
    
    expect(dialog.els.dialogNav.classList.contains(dialog.MODIFIER__HIDE)).toBe(false);
  });
  
  it('should NOT try to remove listeners if the Dialog is a Modal', () => {
    dialog = document.createElement('custom-dialog');
    dialog.modal = true;
    const removeSpy = jest.spyOn(dialog, 'removeDialogListeners');
    dialog.show();
    dialog.close();
    
    expect(removeSpy).not.toHaveBeenCalled();
  });
  
  describe('nested in another Web Component', () => {
    let cwc;
    
    beforeEach(() => {
      cwc = document.createElement('custom-wc');
      document.body.appendChild(cwc);
      dialog = document.querySelector('custom-wc').shadowRoot.querySelector('custom-dialog');
    });
    
    afterEach(() => {
      cwc.remove();
    });
    
    it("should add to the body", () => {
      const appendSpy = jest.spyOn(document.body, 'appendChild');
      dialog.show();
      
      expect(appendSpy).not.toHaveBeenCalledWith(dialog);
    });
    
    it("should NOT remove", () => {
      const removeSpy = jest.spyOn(dialog, 'remove');
      dialog.show();
      dialog.close();
      jest.advanceTimersByTime(dialog.ANIM_DURATION);
      
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('Dialog in view', () => {
    beforeEach(() => {
      dialog = document.createElement('custom-dialog');
      dialog.innerHTML = `
        <form slot="dialogBody">
          <input type="text" name="username" />
          <input type="text" name="password" />
        </form>
      `;
      dialog.show();
    });
    
    it("should focus the Dialog after it's opened", () => {
      dialog.els.dialogBody = undefined;
      rAF();
      expect(document.activeElement).toEqual(dialog);
    });
    
    it("should focus the first visible input in the Dialog after it's opened", () => {
      const firstInput = document.querySelector('custom-dialog input[name="username"]');
      rAF();
      expect(document.activeElement).toEqual(firstInput);
    });
    
    it('should animate the Dialog in to view', () => {
      jest.advanceTimersByTime(100);
      expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__SHOW)).toBe(true);
      expect(dialog.els.dialogBGMask.classList.contains(dialog.MODIFIER__SHOW)).toBe(true);
    });
    
    it.each([
      ['Close button click', { el: 'closeBtn' }],
      ['mask was clicked', { el: 'dialogBGMask' }],
      ['the ESC key was pressed', { el: 'window', code: 'Escape' }],
      ['the ESC key was pressed', { el: 'window', key: 'Escape' }],
      ['the ESC key was pressed', { el: 'window', keyCode: 27 }],
    ])('should close the Dialog after %s', (l, { el, ...code }) => {
      expect(window.customDialog).toEqual(dialog);
      expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__CLOSING)).toBe(false);
      
      if (el !== 'window') {
        dialog.els[el].click();
      }
      else {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
        expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__CLOSING)).toBe(false);
        
        window.dispatchEvent(new KeyboardEvent('keydown', code));
      }
      
      expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__CLOSING)).toBe(true);
      expect(dialog.els.dialogBGMask.classList.contains(dialog.MODIFIER__SHOW)).toBe(false);
      
      jest.advanceTimersByTime(dialog.ANIM_DURATION);
      expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__SHOW)).toBe(false);
      expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__CLOSING)).toBe(false);
      expect(window.customDialog).toBeUndefined();
    });
    
    it.each([
      ['mask was clicked', { el: 'dialogBGMask' }],
      ['the ESC key was pressed', { el: 'window', code: 'Escape' }],
      ['the ESC key was pressed', { el: 'window', key: 'Escape' }],
      ['the ESC key was pressed', { el: 'window', keyCode: 27 }],
    ])('should NOT close the Dialog after %s when the Dialog is a Modal', (l, { el, ...code }) => {
      dialog.modal = true;
      const closeSpy = jest.spyOn(dialog, 'close');
      
      if (el !== 'window') dialog.els[el].click();
      else window.dispatchEvent(new KeyboardEvent('keydown', code));
      
      expect(closeSpy).not.toHaveBeenCalled();
    });
    
    describe('setters & getters', () => {
      describe('modal', () => {
        it('get', () => {
          expect(dialog.modal).toBe(false);
          
          dialog.modal = true;
          expect(dialog.modal).toBe(true);
        });
        
        it('set', () => {
          const addListenersSpy = jest.spyOn(dialog, 'addDialogListeners');
          const removeListenersSpy = jest.spyOn(dialog, 'removeDialogListeners');
          const displayTitleSpy = jest.spyOn(dialog, 'displayTitleBar');
          
          dialog.modal = true;
          expect(addListenersSpy).not.toHaveBeenCalled();
          expect(removeListenersSpy).toHaveBeenCalled();
          expect(displayTitleSpy).toHaveBeenCalled();
          expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__MODAL)).toBe(true);
          
          addListenersSpy.mockReset();
          removeListenersSpy.mockReset();
          displayTitleSpy.mockReset();
          dialog.modal = false;
          expect(addListenersSpy).toHaveBeenCalled();
          expect(removeListenersSpy).not.toHaveBeenCalled();
          expect(displayTitleSpy).toHaveBeenCalled();
          expect(dialog.els.dialog.classList.contains(dialog.MODIFIER__MODAL)).toBe(false);
        });
      });
      
      describe('onClose', () => {
        it('set', () => {
          const closeHandler = jest.fn();
          dialog.onClose = closeHandler;
          dialog.close();
          jest.advanceTimersByTime(dialog.ANIM_DURATION);
          
          expect(closeHandler).toHaveBeenCalled();
        });
      });
      
      describe('title', () => {
        it('get', () => {
          expect(dialog.title).toBe('');
          
          const title = 'Ima Dialog';
          dialog.title = title;
          expect(dialog.title).toBe(title);
        });
        
        it('set', () => {
          const title = '<span class="icon"></span> Ima Dialog';
          
          dialog.title = title;
          expect(dialog.els.dialogTitle.innerHTML).toBe(title);
          expect(dialog.els.closeBtn.classList.contains(dialog.MODIFIER__HIDE)).toBe(false);
          expect(dialog.els.dialogNav.classList.contains(dialog.MODIFIER__HIDE)).toBe(false);
          
          dialog.modal = true;
          dialog.title = '';
          expect(dialog.els.closeBtn.classList.contains(dialog.MODIFIER__HIDE)).toBe(true);
          expect(dialog.els.dialogNav.classList.contains(dialog.MODIFIER__HIDE)).toBe(true);
        });
      });
    });
  });
});
