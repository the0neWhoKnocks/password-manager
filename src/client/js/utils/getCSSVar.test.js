describe('getCSSVar', () => {
  const var1Name = '--cssVar1';
  const var1Val = 'FF0000';
  const var2Name = '--cssVar2';
  const var2Val = 450;
  const var3Name = '--cssVar3';
  const var3Val = 300;
  const var4Name = '--cssVar4';
  const var4Val = 1;
  
  beforeEach(() => {
    jest.resetModules();
    delete window.utils;
      
    document.documentElement.style.setProperty(var1Name, `#${var1Val}`);
    document.documentElement.style.setProperty(var2Name, `${var2Val}px`);
    document.documentElement.style.setProperty(var3Name, `${var3Val}ms`);
    document.documentElement.style.setProperty(var4Name, `${var4Val}s`);
  });
  
  it('should NOT create the utils namespace if it already exists', () => {
    window.utils = { fu: jest.fn() };
    require('./getCSSVar');
    expect(window.utils.fu).not.toBe(undefined);
  });
  
  it.each([
    ['String', { varName: var1Name, varVal: `#${var1Val}` }],
    ['Number', { toNumber: true, varName: var2Name, varVal: var2Val }],
    ['Number', { toNumber: true, varName: var3Name, varVal: var3Val }],
    ['Number', { toNumber: true, varName: var4Name, varVal: var4Val }],
  ])('should return a %s value', (l, { toNumber, varName, varVal }) => {
    require('./getCSSVar');
    const args = [varName];
    if (toNumber) args.push({ toNumber });
    
    expect(window.utils.getCSSVar(...args)).toBe(varVal);
  });
});