/**
 * Takes an input name like `user[][1][name]` and builds out an appropriate
 * nested Array or Object structure.
 *
 * @param {String} name - The input's name
 * @param {String} value - The input's value
 * @param {Object} objRef - The current Object reference of the FormData
 * @example
 * convertInputName('user[][1][name]', 'John', {});
 * // The Object passed in will now look like this
 * // { user: [ [<empty>, { name: 'John' }] ] }
 */
function convertInputName(name, value, objRef) {
  const regEx = /\[(.*?)\]/g;
  const matches = name.match(regEx);

  if (matches) {
    const firstKey = name.match(/([^\[]+)/)[0]; // eslint-disable-line no-useless-escape
    let currRef = objRef;
    
    matches.forEach((m) => {
      const bracketContents = m.match(regEx.source)[1];
      const ndx = +bracketContents;
      let newRef;

      if (isNaN(ndx)) {
        newRef = { [bracketContents]: value };
        if (Array.isArray(currRef)) currRef.push({ [bracketContents]: value });
        else {
          if (currRef === objRef) {
            if (!currRef[firstKey]) currRef[firstKey] = {};
            currRef = currRef[firstKey];
          }
          currRef[bracketContents] = value;
        }
      }
      else {
        newRef = [];
        if (Array.isArray(currRef)) currRef[ndx] = newRef;
        else currRef[firstKey] = newRef;
        currRef = newRef;
      }
    });
  }
  
  delete objRef[name];
}

if (!window.utils) window.utils = {};

window.utils.serializeForm = function serializeForm(formEl) {
  const formData = Object.fromEntries(new FormData(formEl));
  Object.keys(formData).forEach((prop) => {
    if (prop.includes('[')) convertInputName(prop, formData[prop], formData);
  });
  
  return formData;
}