if (!window.utils) window.utils = {};

window.utils.serializeForm = function serializeForm(formEl, asArray) {
  const formData = new FormData(formEl);
  const data = Array.from(formData.entries()).reduce((memo, pair) => {
    return (asArray)
      ? [...memo, { name: pair[0], value: pair[1] }]
      : { ...memo, [pair[0]]: pair[1] };
  }, asArray ? [] : {});
  return data;
}