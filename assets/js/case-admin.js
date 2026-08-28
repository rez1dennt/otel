(() => {
  const REMOVE_BUTTON = '<button type="button" data-case-remove></button>';
  void REMOVE_BUTTON;

  for (const repeater of document.querySelectorAll('[data-case-repeater]')) {
    const rows = repeater.querySelector('[data-case-rows]');
    const template = repeater.querySelector('[data-case-template]');
    const addButton = repeater.querySelector('[data-case-add]');
    const limitMessage = repeater.querySelector('[data-case-limit-message]');
    const limit = Number(repeater.dataset.caseLimit || 1);
    let nextIndex = rows.querySelectorAll('[data-case-row]').length;

    const synchronizeLimit = () => {
      const atLimit = rows.querySelectorAll('[data-case-row]').length >= limit;
      addButton.disabled = atLimit;
      limitMessage.hidden = !atLimit;
    };

    addButton.addEventListener('click', () => {
      if (rows.querySelectorAll('[data-case-row]').length >= limit) return;
      const html = template.innerHTML.replaceAll('__INDEX__', String(nextIndex++));
      rows.insertAdjacentHTML('beforeend', html);
      rows.querySelector('[data-case-row]:last-child input, [data-case-row]:last-child textarea')?.focus();
      synchronizeLimit();
    });

    rows.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-case-remove]');
      if (!removeButton) return;
      removeButton.closest('[data-case-row]')?.remove();
      addButton.focus();
      synchronizeLimit();
    });

    synchronizeLimit();
  }
})();

