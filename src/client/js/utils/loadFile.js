/**
 * Prompts a User to pick a file from their filesystem. Once it's loaded, the
 * file is read, and returned via a Promise.
 *
 * @param {Object} [opts] - options
 * @param {Function} [opts.onFileAdd] - Callback envoked after a User picks a file
 * @returns {Promise}
 * @example
 * loadFile().then((data) => { console.log(data); });
 * loadFile({
 *   onFileAdd: () => {},
 * }).then((data) => { console.log(data); });
 */
function loadFile({ onFileAdd } = {}) {
  return new Promise((resolve) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.addEventListener('change', (ev) => {
      const importedFile = ev.target.files[0];
      const reader = new FileReader();
      
      if (onFileAdd) onFileAdd();
      
      reader.addEventListener('load', (readEv) => {
        const content = readEv.target.result;
        resolve(content);
      });
      reader.readAsText(importedFile);
    });
    
    fileInput.click();
  });
}

if (!window.utils) window.utils = {};
window.utils.loadFile = loadFile;
