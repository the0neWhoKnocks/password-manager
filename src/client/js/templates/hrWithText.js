(() => {
  const hrWithText = ({
    className = '',
    label = '',
  }) => {
    return `
      <div class="hr-with-text ${className}">
        <span>${label}</span>
      </div>
    `;
  };
  
  if (!window.templates) window.templates = {};
  window.templates.hrWithText = hrWithText;
})();
