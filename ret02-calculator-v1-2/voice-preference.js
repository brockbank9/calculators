(() => {
  if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
    let cachedVoice = null;

    const preferredNames = [
      'Microsoft Aria',
      'Microsoft Jenny',
      'Microsoft Zira',
      'Samantha',
      'Microsoft Ava',
      'Ava',
      'Google US English'
    ];

    function chooseVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return null;

      const english = voices.filter(voice => /^en([-_]|$)/i.test(voice.lang || ''));
      const pool = english.length ? english : voices;

      for (const preferred of preferredNames) {
        const exact = pool.find(voice => voice.name.toLowerCase().includes(preferred.toLowerCase()));
        if (exact) return exact;
      }

      const femaleHints = ['female', 'woman', 'aria', 'jenny', 'zira', 'samantha', 'ava', 'susan', 'victoria', 'karen', 'moira', 'tessa', 'veena', 'fiona'];
      const femaleMatch = pool.find(voice => femaleHints.some(hint => voice.name.toLowerCase().includes(hint)));
      return femaleMatch || pool[0] || null;
    }

    function refreshVoice() {
      cachedVoice = chooseVoice();
    }

    refreshVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoice);
    window.speechSynthesis.onvoiceschanged = refreshVoice;

    const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = utterance => {
      if (utterance && !utterance.voice) {
        cachedVoice = cachedVoice || chooseVoice();
        if (cachedVoice) {
          utterance.voice = cachedVoice;
          utterance.lang = cachedVoice.lang || 'en-US';
        } else {
          utterance.lang = 'en-US';
        }
      }
      originalSpeak(utterance);
    };
  }

  // Load the Version 1.2 select-field compatibility fix without coupling it
  // to the main scenario-planner implementation.
  const script = document.createElement('script');
  script.src = 'select-field-fix.js?v=1208';
  script.defer = true;
  document.head.appendChild(script);
})();
