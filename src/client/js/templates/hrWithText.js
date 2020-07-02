(() => {
  const hrWithText = ({
    label = '',
  }) => {
    return `
      <div class="hr-with-text">
        <span>${label}</span>
      </div>
    `;
  };
  
  if (!window.templates) window.templates = {};
  window.templates.hrWithText = hrWithText;
})();
