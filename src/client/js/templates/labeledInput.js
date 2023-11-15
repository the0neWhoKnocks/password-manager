(() => {
  const genUniqueId = (txt) => btoa(`cli_${txt}`).replace(/=/g, '');
  const labeledInput = ({
    deletable,
    disabled,
    extraClasses = '',
    helpText = '',
    hiddenValue = '',
    label = '',
    lowerMarkup = '',
    name = '',
    placeholder = '',
    required,
    type = 'text',
    value = '',
  } = {}) => {
    const id = genUniqueId(name);
    const input = `
      <input
        type="${type}"
        id="${id}"
        ${name ? `name="${name}"` : ''}
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        ${value ? `value="${value}"` : ''}
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
      />
    `;
    const textarea = `
      <textarea
        id="${id}"
        ${name ? `name="${name}"` : ''}
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
      >${value ? value : ''}</textarea>
    `;
    return `
      <div class="labeled-input ${extraClasses}">
        <div class="labeled-input__wrapper">
          ${hiddenValue ? (`
            <input type="hidden" name="${name}_hidden" value="${hiddenValue}" />
          `) : ''}
          ${deletable ? (`
            <div class="labeled-input__deletable">
              ${textarea}
              <button type="button" value="deleteInput">✕</button>
            </div>
          `) : input}
          <label for="${id}">${label}</label>
          ${required ? (`
            <svg class="svg-icon">
              <use xlink:href="#asterisk" xmlns:xlink="http://www.w3.org/1999/xlink"></use>
            </svg>
          `) : ''}
        </div>
        ${helpText ? `<p class="help-text">${helpText}</p>` : ''}
        ${lowerMarkup}
      </div>
    `;
  };
  
  if (!window.templates) window.templates = {};
  window.templates.labeledInput = labeledInput;
})();
