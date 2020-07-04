if (!window.utils) window.utils = {};

window.utils.getCSSVar = function getCSSVar(varName, {
  toNumber = false,
}) {
  let val = window.getComputedStyle(document.documentElement).getPropertyValue(varName);
  
  if (toNumber) {
    val = +(val.replace(/(ms|s|px)$/, ''));
  }
  
  return val;
}
