require('../templates/hrWithText');
require('../templates/labeledInput');
require('../wcs/CustomDialog');
require('./configSetUp');

describe('configSetUp', () => {
  const postErr = 'ruh-roh';
  let setupSuccessful = true;
  let dialog;
  let form;
  
  beforeEach(() => {
    window.utils = {
      postData: jest.fn(() => {
        return (setupSuccessful) ? Promise.resolve() : Promise.reject({ error: postErr });
      }),
      storage: { clear: jest.fn() },
    };
    
    window.showConfigSetUp();
    dialog = document.querySelector('custom-dialog');
    form = dialog.querySelector('#createConfig');
  });
  
  it('should display the Config Setup Dialog', () => {
    expect(form.action.endsWith('/api/config/create')).toBe(true);
    expect(form.method).toBe('post');
    expect(form.getAttribute('autocomplete')).toBe('off');
    
    const labeledInputs = [...form.querySelectorAll('.labeled-input')];
    const input1 = labeledInputs[0].querySelector('input');
    const label1 = labeledInputs[0].querySelector('label');
    const ht1 = labeledInputs[0].querySelector('.help-text');
    expect(input1.name).toBe('cipherKey');
    expect(input1.placeholder).not.toBe('');
    expect(label1.textContent).toBe('Cipher Key');
    expect(label1.getAttribute('for')).toBe(input1.id);
    expect(ht1.textContent).not.toBe('');
    const input2 = labeledInputs[1].querySelector('input');
    const label2 = labeledInputs[1].querySelector('label');
    const ht2 = labeledInputs[1].querySelector('.help-text');
    expect(input2.name).toBe('salt');
    expect(input2.placeholder).not.toBe('');
    expect(label2.textContent).toBe('Salt');
    expect(label2.getAttribute('for')).toBe(input2.id);
    expect(ht2.textContent).not.toBe('');
  });
  
  describe('submits data', () => {
    it('should handle successful submission of data', (done) => {
      const submitBtn = form.querySelector('[value="create"]');
      window.testCtx.location('reload', jest.fn());
      submitBtn.click();
      
      process.nextTick(() => {
        expect(window.utils.postData).toHaveBeenCalledWith(form.action, form);
        expect(window.location.reload).toHaveBeenCalled();
        done();
      });
    });
    
    it('should handle a failed submission of data', (done) => {
      const submitBtn = form.querySelector('[value="create"]');
      setupSuccessful = false;
      submitBtn.click();
      
      process.nextTick(() => {
        expect(window.alert).toHaveBeenCalledWith(postErr);
        done();
      });
    });
  });
});