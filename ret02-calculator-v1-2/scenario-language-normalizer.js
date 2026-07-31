(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('aipro') !== 'on') return;

  function normalizeScenarioLanguage(text) {
    let normalized = String(text || '');

    if (/social security/i.test(normalized)) {
      const explicitN = /social security[^.!?]{0,30}\b(?:to|=|as)\s*n\b/i.test(normalized) || /\bn\s+(?:for\s+)?social security\b/i.test(normalized);
      const explicitY = /social security[^.!?]{0,30}\b(?:to|=|as)\s*y\b/i.test(normalized) || /\by\s+(?:for\s+)?social security\b/i.test(normalized);
      const negative = explicitN || /\b(no|not|without|exclude|excluding|excluded|remove|removing|off|disable|disabled|don't|do not)\b/i.test(normalized);
      const positive = explicitY || /\b(yes|include|including|included|with|on|enable|enabled)\b/i.test(normalized);

      if (negative) {
        normalized = normalized
          .replace(/social security[^.!?]{0,30}\b(?:to|=|as)\s*n\b/ig, 'exclude Social Security')
          .replace(/\bn\s+(?:for\s+)?social security\b/ig, 'exclude Social Security')
          .replace(/\bwith\s+no\s+social security\b/ig, 'excluding Social Security')
          .replace(/\bno\s+social security\b/ig, 'exclude Social Security')
          .replace(/\bwithout\s+social security\b/ig, 'exclude Social Security')
          .replace(/\bdo not include\s+social security\b/ig, 'exclude Social Security')
          .replace(/\bdon't include\s+social security\b/ig, 'exclude Social Security');

        if (!/\b(exclude|without|remove|turn off)\b/i.test(normalized)) {
          normalized += ' exclude Social Security';
        }
      } else if (positive) {
        normalized = normalized
          .replace(/social security[^.!?]{0,30}\b(?:to|=|as)\s*y\b/ig, 'include Social Security')
          .replace(/\by\s+(?:for\s+)?social security\b/ig, 'include Social Security');
        if (!/\b(include|turn on)\b/i.test(normalized)) normalized += ' include Social Security';
      }
    }

    if (/marital|married|single/i.test(normalized)) {
      const explicitS = /(?:marital(?: status)?|single or married)[^.!?]{0,30}\b(?:to|=|as)\s*s\b/i.test(normalized);
      const explicitM = /(?:marital(?: status)?|single or married)[^.!?]{0,30}\b(?:to|=|as)\s*m\b/i.test(normalized);
      if (explicitS || /\b(not married|unmarried|single|no spouse)\b/i.test(normalized)) {
        normalized = normalized
          .replace(/(?:marital(?: status)?|single or married)[^.!?]{0,30}\b(?:to|=|as)\s*s\b/ig, 'marital status to single')
          .replace(/\bnot married\b/ig, 'single');
      } else if (explicitM || /\bmarried|with spouse\b/i.test(normalized)) {
        normalized = normalized.replace(/(?:marital(?: status)?|single or married)[^.!?]{0,30}\b(?:to|=|as)\s*m\b/ig, 'marital status to married');
        if (!/\bmarried\b/i.test(normalized)) normalized += ' married';
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
