describe('labeledInput', () => {
  let domEl;
  let inputs;
  let labelEl;
  let helpTxtEl;
  
  function render(opts) {
    document.body.innerHTML = '';
    document.body.insertAdjacentHTML(
      'beforeend',
      window.templates.labeledInput(opts)
    );
    domEl = document.body.querySelector('.labeled-input');
    inputs = [...domEl.querySelectorAll('input')];
    labelEl = domEl.querySelector('label');
    helpTxtEl = domEl.querySelector('.help-text');
  }
  
  beforeEach(() => {
    jest.resetModules();
    delete window.templates;
  });
  
  it('should NOT create the templates namespace if it already exists', () => {
    window.templates = { fu: 'bar' };
    require('./labeledInput');
    expect(window.templates.fu).not.toBe(undefined);
  });
  
  it('should render the default markup', () => {
    require('./labeledInput');
    render();
    
    expect(domEl.classList.length).toBe(1);
    expect(inputs.length).toBe(1);
    expect(inputs[0].type).toBe('text');
    expect(inputs[0].id).toBe('Y2xpXw');
    expect(labelEl.getAttribute('for')).toBe('Y2xpXw');
  });
  
  it('should render custom markup', () => {
    require('./labeledInput');
    const opts = {
      disabled: true,
      extraClasses: 'custom',
      helpText: 'This describes the input',
      hiddenValue: 'imKindaSecret',
      label: 'Input Label',
      lowerMarkup: '<div class="under-input"></div>',
      name: 'inputName',
      placeholder: 'Input placeholder text',
      required: true,
      type: 'email',
      value: 'user@email.com',
    };
    render(opts);
    
    expect(domEl.classList.length).toBe(2);
    expect(domEl.classList.contains('custom')).toBe(true);
    expect(inputs[0].type).toBe('hidden');
    expect(inputs[0].name).toBe(`${opts.name}_hidden`);
    expect(inputs[0].value).toBe(opts.hiddenValue);
    expect(inputs[1].type).toBe(opts.type);
    expect(inputs[1].id).toBe('Y2xpX2lucHV0TmFtZQ');
    expect(inputs[1].name).toBe(opts.name);
    expect(inputs[1].placeholder).toBe(opts.placeholder);
    expect(inputs[1].value).toBe(opts.value);
    expect(inputs[1].required).toBe(opts.required);
    expect(inputs[1].disabled).toBe(opts.disabled);
    expect(labelEl.getAttribute('for')).toBe('Y2xpX2lucHV0TmFtZQ');
    expect(helpTxtEl.textContent.trim()).toBe(opts.helpText);
    expect(domEl.querySelector('.under-input')).not.toBe(null);
  });
});