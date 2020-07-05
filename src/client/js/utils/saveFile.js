/**
 * Allows you to prompt a User to save a file after they've clicked on something.
 *
 * @param {String} data - The text that'll be written to the file.
 * @param {String} name - The name of the file.
 * @param {String} type - The file type. Use one of `saveFile.FILE_TYPE__*`
 * @example
 * saveFile({
 *   data: JSON.stringify(someObj, null, 2),
 *   name: 'backup.json',
 *   type: saveFile.FILE_TYPE__JSON,
 * });
 */
function saveFile({ data, name, type }) {
  if (!data || !name || !type) throw Error(`You're missing a required param: data: "${data}" | name: "${name}" | type: "${type}"`);
  
  const file = new Blob([data], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  a.remove();
}
saveFile.FILE_TYPE__JSON = 'application/json';
saveFile.FILE_TYPE__TEXT = 'text/plain';

if (!window.utils) window.utils = {};
window.utils.saveFile = saveFile;
