(() => {
  const genUniqueId = (txt) => btoa(`cli_${txt}`).replace(/=/g, '');
  const labeledInput = ({
    helpText = '',
    label,
    name,
    placeholder = '',
    required,
    type = 'text',
    value = '',
  }) => {
    const id = genUniqueId(name);
    return `
      <div class="labeled-input">
        <div class="labeled-input__wrapper">
          <input
            type="${type}"
            id="${id}"
            name="${name}"
            placeholder="${placeholder}"
            value="${value}"
            ${required ? 'required' : ''}
          />
          <label for="${id}">${label}</label>
        </div>
        ${helpText && `<p class="help-text">${helpText}</p>`}
      </div>
    `;
  };
  
  if (!window.markup) window.markup = {};
  window.markup.labeledInput = labeledInput;
})();
