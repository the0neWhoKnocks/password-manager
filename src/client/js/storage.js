if (!window.utils) window.utils = {};

window.utils.storage = {
  key: 'pass_man',
  clear: function clearStorageData() {
    let storageType;
    
    if (window.sessionStorage[this.key]) storageType = 'sessionStorage';
    else if (window.localStorage[this.key]) storageType = 'localStorage';
    
    if (storageType) window[storageType].removeItem(this.key)
  },
  get: function getStorageData(prop) {
    let data;
    let storageType;
    
    if (window.sessionStorage[this.key]) storageType = 'sessionStorage';
    else if (window.localStorage[this.key]) storageType = 'localStorage';
    
    if (storageType) {
      data = JSON.parse(window[storageType].getItem(this.key));
      if (prop) data = data[prop];
    }
    
    return data;
  },
  set: function setStorageData(data, useLocal) {
    let storageType;
    
    // ensure there's only ever one source of truth for data
    if (useLocal) {
      storageType = 'localStorage';
      window.sessionStorage.removeItem(this.key);
    }
    else {
      storageType = 'sessionStorage';
      window.localStorage.removeItem(this.key);
    }
    
    const currentData = window[storageType].getItem(this.key) || '{}';
    window[storageType].setItem(this.key, JSON.stringify({
      ...JSON.parse(currentData),
      ...data,
    }));
  },
};
