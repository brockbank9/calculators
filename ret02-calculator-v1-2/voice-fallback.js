(() => {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;

  const preferredNames = [
    'Microsoft Aria',
    'Microsoft Jenny',
    'Microsoft Zira',
    'Samantha',
    'Microsoft Ava',
    'Ava',
    'Google US English',
    'Google UK English Female'
  ];

  let voices = [];
  let preferredVoice = null;
  const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);

  function normalize(value) {
    return String(value || '').toLowerCase();
  }

  function selectPreferredVoice() {
    voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;

    for (const preferredName of preferredNames) {
      const exact = voices.find(voice => normalize(voice.name).includes(normalize(preferredName)) && normalize(voice.lang).startsWith('en'));
      if (exact) return exact;
    }

    const femaleNamed = voices.find(voice => {
      const name = normalize(voice.name);
      return normalize(voice.lang).startsWith('en') && /(female|woman|aria|jenny|zira|samantha|ava|victoria|karen|moira|tessa|susan)/.test(name);
    });
    if (femaleNamed) return femaleNamed;

    return voices.find(voice => normalize(voice.lang).startsWith('en-us'))
      || voices.find(voice => normalize(voice.lang).startsWith('en'))
      || voices[0];
  }

  function ensureIndicator() {
    const controls = document.querySelector('.pro-controls');
    if (!controls) return null;
    let indicator = document.getElementById('proVoiceEngine');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.id = 'proVoiceEngine';
      indicator.className = 'pro-control';
      indicator.setAttribute('aria-live', 'polite');
      indicator.style.cursor = 'default';
      indicator.style.fontWeight = '600';
      indicator.textContent = '● OpenAI Voice';
      controls.appendChild(indicator);
    }
    return indicator;
  }

  function setVoiceEngine(label, fallback) {
    const indicator = ensureIndicator();
    if (!indicator) return;
    indicator.textContent = `${fallback ? '●' : '●'} ${label}`;
    indicator.style.color = fallback ? '#92400e' : '#166534';
    indicator.style.background = fallback ? '#fffbeb' : '#f0fdf4';
    indicator.style.borderColor = fallback ? '#fde68a' : '#bbf7d0';
  }

  function refreshVoices() {
    preferredVoice = selectPreferredVoice();
  }

  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
  window.speechSynthesis.onvoiceschanged = refreshVoices;

  window.speechSynthesis.speak = utterance => {
    refreshVoices();
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang || 'en-US';
    } else {
      utterance.lang = 'en-US';
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    setVoiceEngine(preferredVoice ? `Browser Voice: ${preferredVoice.name}` : 'Browser Voice', true);
    return originalSpeak(utterance);
  };

  const observer = new MutationObserver(() => {
    if (document.querySelector('.pro-controls')) {
      ensureIndicator();
      observer.disconnect();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('aipro-openai-voice', () => setVoiceEngine('OpenAI Voice', false));
})();