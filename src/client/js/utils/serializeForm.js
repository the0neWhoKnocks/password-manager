/**
 * Takes an input name like `user[1][name]` and builds out an appropriate
 * nested Array or Object structure.
 *
 * @param {String} name - The input's name
 * @param {String} value - The input's value
 * @param {Object} objRef - The current Object reference
 * @example
 * convertInputName('user[][1][name]', 'John', {});
 * // The Object passed in will now look like this
 * // { user: [ [ <empty>, { name: 'John' } ] ] }
 */
function convertInputName(name, value, objRef) {
  const regEx = /\[(.*?)\]/g;
  const matches = name.match(regEx);

  if (matches) {
    const firstKey = name.match(/([^\[]+)/)[0]; // eslint-disable-line no-useless-escape
    let currRef = objRef;
    
    const getBracketValue = (str) => {
      let ndx;
      let value;
      
      if (str) {
        value = str.match(regEx.source)[1];
        ndx = +value;
      }
      
      return { ndx, value };
    };
    
    matches.forEach((m, objNdx) => {
      const { value: bracketContents, ndx } = getBracketValue(m);
      const isLast = matches.length - 1 === objNdx;
      const { ndx: nextNdx } = getBracketValue(matches[objNdx + 1]);
      const nextType = (isNaN(nextNdx)) ? {} : [];
      let newRef;
      
      if (objNdx === 0 && !currRef[firstKey]) {
        const currType = (isNaN(ndx) && bracketContents !== '') ? {} : [];
        currRef[firstKey] = currType;
      }
      
      if (objNdx === 0) currRef = currRef[firstKey];

      if (isNaN(ndx)) {
        if (isLast) currRef[bracketContents] = value;
        else {
          currRef[bracketContents] = nextType;
          currRef = currRef[bracketContents];
        }
      }
      else {
        if (bracketContents === '') {
          newRef = nextType;
          currRef.push(newRef);
        }
        else {
          newRef = nextType;
          currRef[ndx] = newRef;
        }
        
        currRef = newRef;
      }
    });
  }
}

if (!window.utils) window.utils = {};

window.utils.serializeForm = function serializeForm(formEl) {
  const formData = Object.fromEntries(new FormData(formEl));
  const serialized = {};
  Object.keys(formData).forEach((prop) => {
    if (prop.includes('[')) convertInputName(prop, formData[prop], serialized);
    else serialized[prop] = formData[prop];
  });
  
  return serialized;
}