const defineSpy = jest.spyOn(window.customElements, 'define');

require('./CustomDropDown');

jest.useFakeTimers();

describe('CustomDropDown', () => {
  it('should define the custom DropDown', () => {
    expect(defineSpy).toHaveBeenCalledWith('custom-drop-down', expect.any(Function));
  });
  
  describe('added to DOM', () => {
    let nav;
    let dd;
    let btn;
    
    beforeEach(() => {
      nav = document.createElement('nav');
      nav.innerHTML = `
        <custom-drop-down label="DD Menu">
          <button slot="ddItems" type="button">Item 1</button>
          <button slot="ddItems" type="button">Item 2</button>
        </custom-drop-down>
        <button id="otherBtn" type="button">Btn</button>
      `;
      document.body.appendChild(nav);
      dd = nav.querySelector('custom-drop-down');
      btn = nav.querySelector('#otherBtn');
    });
    
    afterEach(() => {
      nav.remove();
    });
    
    it('should open & close the drop-down', () => {
      expect(dd.els.dd.classList.contains('open')).toBe(false);
      
      dd.els.btn.click();
      expect(dd.els.dd.classList.contains('open')).toBe(true);
      
      dd.els.btn.click();
      expect(dd.els.dd.classList.contains('open')).toBe(false);
    });
    
    it('should close the drop-down when focusing or clicking something NOT the drop-down', () => {
      dd.els.btn.click();
      expect(dd.els.dd.classList.contains('open')).toBe(true);
      btn.focus();
      expect(dd.els.dd.classList.contains('open')).toBe(false);
      
      dd.els.btn.click();
      expect(dd.els.dd.classList.contains('open')).toBe(true);
      btn.click();
      expect(dd.els.dd.classList.contains('open')).toBe(false);
    });
    
    describe('setters & getters', () => {
      describe('label', () => {
        it('get', () => {
          expect(dd.label).toBe('DD Menu');
        });
        
        it('set', () => {
          expect(dd.label).toBe('DD Menu');
          dd.label = 'Menu';
          expect(dd.label).toBe('Menu');
        });
      });
    });
  });
});
