describe('hrWithText', () => {
  let domEl;
  
  function render(opts) {
    document.body.innerHTML = '';
    document.body.insertAdjacentHTML(
      'beforeend',
      window.templates.hrWithText(opts)
    );
    domEl = document.body.querySelector('.hr-with-text');
  }
  
  beforeEach(() => {
    jest.resetModules();
    delete window.templates;
  });
  
  it('should NOT create the templates namespace if it already exists', () => {
    window.templates = { fu: 'bar' };
    require('./hrWithText');
    expect(window.templates.fu).not.toBe(undefined);
  });
  
  it('should render the default markup', () => {
    require('./hrWithText');
    render();
    expect(domEl.classList.length).toBe(1);
    expect(domEl.textContent.trim()).toBe('');
  });
  
  it('should render custom markup', () => {
    require('./hrWithText');
    render({ className: 'custom', label: 'Text' });
    expect(domEl.classList.length).toBe(2);
    expect(domEl.classList.contains('custom')).toBe(true);
    expect(domEl.textContent.trim()).toBe('Text');
  });
});