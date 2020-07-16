describe('serializeForm', () => {
  let formEl;
  
  beforeEach(() => {
    jest.resetModules();
    delete window.utils;
    
    formEl = document.createElement('form');
  });
  
  it('should NOT create the utils namespace if it already exists', () => {
    window.utils = { fu: jest.fn() };
    require('./serializeForm');
    expect(window.utils.fu).not.toBe(undefined);
  });
  
  describe('shallow names', () => {
    beforeEach(() => {
      require('./serializeForm');
    });
    
    it('should return the Form data in an Object', () => {
      formEl.innerHTML = `
        <input type="hidden" name="hiddenVal" value="val1" />
        <input type="text" name="textVal" value="val2" />
      `;
      expect(window.utils.serializeForm(formEl)).toEqual({
        hiddenVal: 'val1',
        textVal: 'val2',
      });
    });
  });
  
  describe('nested names', () => {
    beforeEach(() => {
      require('./serializeForm');
    });
    
    it('should NOT try to parse a bad name', () => {
      formEl.innerHTML = `
        <input type="text" name="user[[" value="val1" />
      `;
      expect(window.utils.serializeForm(formEl)).toEqual({});
    });
    
    it('should build out a nested Object', () => {
      formEl.innerHTML = `
        <input type="text" name="user[username]" value="name" />
        <input type="text" name="user[password]" value="secret" />
        <input type="text" name="user[nested][1][fu]" value="bar" />
        <input type="text" name="arr[][fu]" value="bar" />
        <input type="text" name="arr[][child][fiz]" value="bam" />
      `;
      expect(window.utils.serializeForm(formEl)).toEqual({
        arr: [
          { fu: 'bar' },
          { child: { fiz: 'bam' } },
        ],
        user: {
          username: 'name', password: 'secret',
          nested: [undefined, { fu: 'bar' }],
        },
      });
    });
  });
});