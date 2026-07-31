(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('aipro') !== 'on') return;

  const form = document.getElementById('proPreview');
  if (!form) return;

  function normalizeQuestion(text) {
    let normalized = String(text || '');

    if (/social security/i.test(normalized)) {
      if (/(?:set|change|make|switch|use)?[^.]{0,30}(?:to\s*)?(?:no|n|false|off)\b/i.test(normalized)) {
        normalized = normalized.replace(/social security/ig, 'exclude Social Security');
      } else if (/(?:set|change|make|switch|use)?[^.]{0,30}(?:to\s*)?(?:yes|y|true|on)\b/i.test(normalized)) {
        normalized = normalized.replace(/social security/ig, 'include Social Security');
      }
    }

    if (/(?:marital status|single or married)/i.test(normalized)) {
      if (/\bmarried\b/i.test(normalized)) normalized += ' married';
      if (/\bsingle\b/i.test(normalized)) normalized += ' single';
    }

    return normalized;
  }

  document.addEventListener('submit', event => {
    if (event.target?.id !== 'proChatForm') return;
    const input = document.getElementById('proQuestion');
    if (!input) return;
    input.value = normalizeQuestion(input.value);
  }, true);

  function selectedValueFromComparison(labelText) {
    const items = [...document.querySelectorAll('#proCaption .pro-change-list li')];
    const item = items.find(li => li.textContent.trim().toLowerCase().startsWith(labelText.toLowerCase()));
    if (!item) return null;
    const parts = item.textContent.split('→');
    return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : null;
  }

  document.addEventListener('click', event => {
    if (event.target?.id !== 'proApplyScenario') return;

    const includeSS = selectedValueFromComparison('Include Social Security');
    const marital = selectedValueFromComparison('Single or married');

    // Run after the primary scenario planner has applied its changes.
    setTimeout(() => {
      let changed = false;

      if (includeSS === 'Y' || includeSS === 'N') {
        const select = document.getElementById('includeSS');
        if (select && select.value !== includeSS) {
          select.value = includeSS;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          changed = true;
        }
      }

      if (marital === 'M' || marital === 'S') {
        const select = document.getElementById('marital');
        if (select && select.value !== marital) {
          select.value = marital;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          changed = true;
        }
      }

      if (changed) document.getElementById('calc-form')?.requestSubmit();
    }, 0);
  });
})();
