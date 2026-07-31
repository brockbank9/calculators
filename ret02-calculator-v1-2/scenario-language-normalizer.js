(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('aipro') !== 'on') return;

  function normalizeScenarioLanguage(text) {
    let normalized = String(text || '');

    if (/social security/i.test(normalized)) {
      const negative = /\b(no|not|without|exclude|excluding|excluded|remove|removing|off|disable|disabled|don't|do not)\b/i.test(normalized);
      const positive = /\b(yes|include|including|included|with|on|enable|enabled)\b/i.test(normalized);

      if (negative) {
        normalized = normalized
          .replace(/\bwith\s+no\s+social security\b/ig, 'excluding Social Security')
          .replace(/\bno\s+social security\b/ig, 'exclude Social Security')
          .replace(/\bwithout\s+social security\b/ig, 'exclude Social Security')
          .replace(/\bdo not include\s+social security\b/ig, 'exclude Social Security')
          .replace(/\bdon't include\s+social security\b/ig, 'exclude Social Security');

        if (!/\b(exclude|without|remove|turn off)\b/i.test(normalized)) {
          normalized += ' exclude Social Security';
        }
      } else if (positive && !/\b(include|turn on)\b/i.test(normalized)) {
        normalized += ' include Social Security';
      }
    }

    if (/marital|married|single/i.test(normalized)) {
      if (/\b(not married|unmarried|single|no spouse)\b/i.test(normalized)) {
        normalized = normalized.replace(/\bnot married\b/ig, 'single');
      } else if (/\bmarried|with spouse\b/i.test(normalized)) {
        normalized += ' married';
      }
    }

    return normalized;
  }

  document.addEventListener('submit', event => {
    if (event.target?.id !== 'proChatForm') return;
    const input = document.getElementById('proQuestion');
    if (!input) return;
    input.value = normalizeScenarioLanguage(input.value);
  }, true);
})();
