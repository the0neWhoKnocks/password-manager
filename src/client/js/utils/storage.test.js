describe('storage', () => {
  beforeEach(() => {
    jest.resetModules();
    delete window.utils;
    
    window.localStorage = {
      getItem: jest.fn(),
      removeItem: jest.fn(),
      setItem: jest.fn(),
    };
    window.sessionStorage = {
      getItem: jest.fn(),
      removeItem: jest.fn(),
      setItem: jest.fn(),
    };
  });
  
  it('should NOT create the utils namespace if it already exists', () => {
    window.utils = { fu: jest.fn() };
    require('./storage');
    expect(window.utils.fu).not.toBe(undefined);
  });
  
  describe('api', () => {
    beforeEach(() => {
      require('./storage');
    });
    
    it('should have a default key set', () => {
      expect(window.utils.storage.key).toBe('pass_man');
    });
    
    describe('clear', () => {
      it('should clear out all stored data', () => {
        window.utils.storage.clear();
        expect(window.localStorage.removeItem).toHaveBeenCalledWith(window.utils.storage.key);
        expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(window.utils.storage.key);
      });
    });
    
    describe('get', () => {
      const data = { fu: 'bar', fiz: 'bam' };
      
      it.each([
        ['all data from localStorage', { from: 'localStorage', val: data }],
        ['a specific prop from localStorage', { from: 'localStorage', prop: 'fu', val: 'bar' }],
        ['all data from sessionStorage', { from: 'sessionStorage', val: data }],
        ['a specific prop from sessionStorage', { from: 'sessionStorage', prop: 'fu', val: 'bar' }],
        ['nothing from localStorage if no data has been saved', { from: 'localStorage' }],
      ])('should return %s', (l, { from, prop, val }) => {
        if (val) {
          const jsonData = JSON.stringify(data);
          window[from][window.utils.storage.key] = jsonData;
          window[from].getItem.mockReturnValue(jsonData);
        }
        else {
          delete window.localStorage[window.utils.storage.key];
          delete window.sessionStorage[window.utils.storage.key];
        }
        
        expect(window.utils.storage.get(prop)).toEqual(val);
      });
    });
    
    describe('set', () => {
      const data = { fu: 'bar' };
      let itemData;
      
      beforeEach(() => {
        window.localStorage.getItem.mockImplementation(() => itemData);
        window.sessionStorage.getItem.mockImplementation(() => itemData);
      });
      
      it('should use localStorage if there is a sessionStorage conflict', () => {
        const lsData = { fiz: 'bam' };
        itemData = JSON.stringify(lsData);
        window.localStorage[window.utils.storage.key] = itemData;
        window.sessionStorage[window.utils.storage.key] = { fiz: 'bam' };
        window.utils.storage.set(data);
        
        expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(window.utils.storage.key);
        expect(window.localStorage.setItem).toHaveBeenCalledWith(window.utils.storage.key, JSON.stringify({
          ...lsData,
          ...data,
        }));
      });
      
      it.each([
        ['set localStorage data', { to: 'localStorage', newData: { fiz: 'bam' } }],
        ['set sessionStorage data', { to: 'sessionStorage', newData: { fiz: 'bam' } }],
        ['account for the first time data is set', { to: 'sessionStorage' }],
      ])('should %s', (l, { newData, to }) => {
        const oppositeStorageType = (to === 'localStorage') ? 'sessionStorage' : 'localStorage';
        itemData = JSON.stringify(newData);
        delete window[oppositeStorageType][window.utils.storage.key];
        window[to][window.utils.storage.key] = itemData;
        window.utils.storage.set(data);
        
        expect(window[oppositeStorageType].removeItem).toHaveBeenCalledWith(window.utils.storage.key);
        expect(window[to].setItem).toHaveBeenCalledWith(window.utils.storage.key, JSON.stringify({
          ...newData,
          ...data,
        }));
      });
    });
  });
});