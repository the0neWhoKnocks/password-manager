(() => {
  const genUniqueId = (txt) => btoa(`cli_${txt}`).replace(/=/g, '');
  const labeledInput = ({
    disabled,
    extraClasses = '',
    helpText = '',
    hiddenValue = '',
    label,
    lowerMarkup = '',
    name = '',
    placeholder = '',
    required,
    type = 'text',
    value = '',
  }) => {
    const id = genUniqueId(name);
    return `
      <div class="labeled-input ${extraClasses}">
        <div class="labeled-input__wrapper">
          ${(hiddenValue) && `
            <input type="hidden" name="${name}_hidden" value="${hiddenValue}" />
          `}
          <input
            type="${type}"
            id="${id}"
            ${name ? `name="${name}"` : ''}
            ${placeholder ? `placeholder="${placeholder}"` : ''}
            ${value ? `value="${value}"` : ''}
            ${required ? 'required' : ''}
            ${disabled ? 'disabled' : ''}
          />
          <label for="${id}">${label}</label>
        </div>
        ${helpText && `<p class="help-text">${helpText}</p>`}
        ${lowerMarkup}
      </div>
    `;
  };
  
  if (!window.templates) window.templates = {};
  window.templates.labeledInput = labeledInput;
})();
