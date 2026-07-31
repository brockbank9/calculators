(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('aipro') !== 'on') return;

  document.body.classList.add('aipro-enabled');

  const chatEndpoint = params.get('aiendpoint') || 'https://retirement-assistant.brockbank.workers.dev/chat';
  const speechEndpoint = params.get('aiprovoiceendpoint') || chatEndpoint.replace(/\/chat$/, '/speech');
  const launchButton = document.getElementById('askProBtn');
  const modal = document.getElementById('proPreview');
  const enabledBadge = document.querySelector('.aipro-badge');
  const inputIds = ['currentAge','currentIncome','spouseIncome','currentSavings','inflation','retireAge','retireYears','desiredPct','preReturn','postReturn','includeSS','marital'];
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (launchButton) {
    launchButton.textContent = 'Ask a Professional';
    launchButton.setAttribute('aria-label', 'Open AI Professional');
  }
  if (enabledBadge) enabledBadge.textContent = 'AI Professional Enabled';

  let history = [];
  let busy = false;
  let muted = false;
  let audio = null;
  let audioUrl = '';
  let lastAnswer = '';
  let recognition = null;
  let listening = false;
  let silenceTimer = null;
  let finalTranscript = '';

  const cleanText = id => (document.getElementById(id)?.innerText || '').replace(/\s+/g, ' ').trim();

  function calculatorContext() {
    const inputs = {};
    inputIds.forEach(id => { inputs[id] = document.getElementById(id)?.value || ''; });
    return {
      activeField: 'completePlan',
      field: null,
      inputs,
      resultsSummary: [cleanText('primaryMessage'), cleanText('waitMessage'), cleanText('metrics')].filter(Boolean).join('\n')
    };
  }

  function buildModal() {
    modal.innerHTML = `
      <div class="pro-preview-backdrop" data-close-pro></div>
      <section class="pro-dialog" role="dialog" aria-modal="true" aria-labelledby="proTitle">
        <button type="button" class="pro-preview-close" data-close-pro aria-label="Close Ask a Professional">×</button>
        <header class="pro-titlebar">
          <div><p class="pro-kicker">AI Professional</p><h2 id="proTitle">Ask a Professional</h2></div>
          <span id="proStatus" class="pro-status" aria-live="polite">Ready</span>
        </header>
        <div class="pro-stage">
          <div id="proAvatar" class="pro-avatar-figure" role="img" aria-label="Female AI professional presenter">
            <div class="pro-hair"></div><div class="pro-ear left"></div><div class="pro-ear right"></div>
            <div class="pro-face"><span class="pro-eye left"></span><span class="pro-eye right"></span><span class="pro-nose"></span><span class="pro-mouth"></span></div>
            <div class="pro-neck"></div><div class="pro-shirt"></div><div class="pro-jacket"></div><div class="pro-tie"></div>
          </div>
          <div id="proCaption" class="pro-caption" aria-live="polite">Hello! I'm your AI Professional. I can explain your retirement projection, answer questions about the calculator, and explore what-if scenarios using your current assumptions.</div>
          <div class="pro-controls">
            <button id="proMute" type="button" class="pro-control">🔊 Voice on</button>
            <button id="proReplay" type="button" class="pro-control" disabled>↻ Replay</button>
          </div>
        </div>
        <form id="proChatForm" class="pro-chat-form">
          <div class="pro-question-wrap">
            <input id="proQuestion" type="text" maxlength="1200" placeholder="Ask about this retirement projection…" autocomplete="off">
            <button id="proMic" type="button" class="pro-mic-button" aria-label="Ask using microphone" title="Ask using microphone">🎤</button>
          </div>
          <button type="submit" class="pro-submit-button">Ask</button>
        </form>
        <div id="proMicHelp" class="pro-mic-help" aria-live="polite"></div>
        <p class="pro-disclaimer">The AI Professional is an educational presentation feature, not a financial professional. It does not provide financial, investment, tax, legal, insurance, or estate-planning advice. The voice is AI-generated.</p>
      </section>`;

    modal.querySelectorAll('[data-close-pro]').forEach(element => element.addEventListener('click', close));
    modal.querySelector('#proChatForm').addEventListener('submit', submitQuestion);
    modal.querySelector('#proMute').addEventListener('click', toggleMute);
    modal.querySelector('#proReplay').addEventListener('click', () => speak(lastAnswer));
    configureMicrophone();
  }

  function status(text) { const element = modal.querySelector('#proStatus'); if (element) element.textContent = text; }
  function caption(text, error = false) { const element = modal.querySelector('#proCaption'); if (element) { element.textContent = text; element.classList.toggle('is-error', error); } }
  function micHelp(text, error = false) { const element = modal.querySelector('#proMicHelp'); if (element) { element.textContent = text; element.classList.toggle('is-error', error); } }
  function animate(speaking) { modal.querySelector('#proAvatar')?.classList.toggle('is-speaking', speaking); }

  function stopVoice() {
    if (audio) { audio.pause(); audio.currentTime = 0; audio = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    animate(false);
  }

  function releaseAudio() { if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = ''; } }

  function browserVoice(text) {
    if (muted || !window.speechSynthesis) { status('Ready'); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.04;
    utterance.onstart = () => { animate(true); status('Speaking'); };
    utterance.onend = () => { animate(false); status('Ready'); };
    utterance.onerror = () => { animate(false); status('Voice unavailable'); };
    window.speechSynthesis.speak(utterance);
  }

  async function speak(text) {
    if (muted || !text) return;
    stopVoice(); releaseAudio(); status('Preparing voice…');
    try {
      const response = await fetch(speechEndpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text, voice:'cedar' }) });
      if (!response.ok) throw new Error('Voice unavailable');
      audioUrl = URL.createObjectURL(await response.blob());
      audio = new Audio(audioUrl);
      audio.onplay = () => { animate(true); status('Speaking'); };
      audio.onended = () => { animate(false); status('Ready'); };
      audio.onerror = () => { animate(false); status('Voice unavailable'); };
      await audio.play();
    } catch { browserVoice(text); }
  }

  function configureMicrophone() {
    const micButton = modal.querySelector('#proMic');
    if (!SpeechRecognition) {
      micButton.hidden = true;
      micHelp('Voice questions are not supported by this browser. You can still type your question.');
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = document.documentElement.lang || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      listening = true;
      finalTranscript = '';
      micButton.classList.add('is-listening');
      micButton.setAttribute('aria-pressed', 'true');
      status('Listening');
      micHelp('Listening… Your words will appear as you speak. The question submits after 3 seconds of silence.');
    };

    recognition.onresult = event => {
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalTranscript += `${transcript} `;
        else interimTranscript += transcript;
      }
      const input = modal.querySelector('#proQuestion');
      input.value = `${finalTranscript}${interimTranscript}`.trim();
      resetSilenceTimer();
    };

    recognition.onerror = event => {
      clearTimeout(silenceTimer);
      const messages = {
        'not-allowed': 'Microphone permission was denied. Allow microphone access in your browser settings and try again.',
        'no-speech': 'No speech was detected. Click the microphone and try again.',
        'audio-capture': 'No microphone was found or it is unavailable.',
        'network': 'Speech recognition could not connect. Please type your question instead.'
      };
      micHelp(messages[event.error] || 'Voice recognition stopped unexpectedly. Please try again.', true);
      stopListening(false);
    };

    recognition.onend = () => {
      listening = false;
      micButton.classList.remove('is-listening');
      micButton.setAttribute('aria-pressed', 'false');
      if (!busy && status) status('Ready');
    };

    micButton.addEventListener('click', () => {
      if (listening) stopListening(false);
      else startListening();
    });
  }

  function startListening() {
    if (!recognition || busy) return;
    stopVoice();
    clearTimeout(silenceTimer);
    const input = modal.querySelector('#proQuestion');
    input.value = '';
    try { recognition.start(); }
    catch { micHelp('The microphone is already starting. Please wait a moment.', true); }
  }

  function resetSilenceTimer() {
    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      const input = modal.querySelector('#proQuestion');
      if (!input?.value.trim()) return;
      stopListening(false);
      micHelp('Question captured. Submitting…');
      setTimeout(() => modal.querySelector('#proChatForm')?.requestSubmit(), 100);
    }, 3000);
  }

  function stopListening(clearMessage = true) {
    clearTimeout(silenceTimer);
    if (recognition && listening) {
      try { recognition.stop(); } catch {}
    }
    listening = false;
    const micButton = modal.querySelector('#proMic');
    micButton?.classList.remove('is-listening');
    micButton?.setAttribute('aria-pressed', 'false');
    if (clearMessage) micHelp('');
  }

  async function liveAnswer(question) {
    const response = await fetch(chatEndpoint, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ question, mode:'pro', calculatorContext:calculatorContext(), conversation:history.slice(-6) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.answer) throw new Error(data.error || 'The AI Professional is temporarily unavailable.');
    return data.answer;
  }

  async function submitQuestion(event) {
    event.preventDefault();
    if (busy) return;
    stopListening(true);
    const input = modal.querySelector('#proQuestion');
    const question = input.value.trim();
    if (!question) return;

    const submitButton = modal.querySelector('.pro-submit-button');
    busy = true; input.disabled = true; submitButton.disabled = true;
    stopVoice(); caption(`You asked: ${question}`); status('Thinking…');
    try {
      const answer = await liveAnswer(question);
      history.push({role:'user',content:question},{role:'assistant',content:answer});
      history = history.slice(-8); lastAnswer = answer;
      caption(answer); modal.querySelector('#proReplay').disabled = false;
      await speak(answer);
    } catch (error) { caption(error.message || 'The AI Professional is temporarily unavailable.', true); status('Unavailable'); }
    finally { busy = false; input.disabled = false; submitButton.disabled = false; input.value = ''; input.focus(); }
  }

  function toggleMute() {
    muted = !muted;
    const button = modal.querySelector('#proMute');
    button.textContent = muted ? '🔇 Voice off' : '🔊 Voice on';
    button.setAttribute('aria-pressed', String(muted));
    if (muted) { stopVoice(); status('Voice off'); } else status('Ready');
  }

  function open() {
    if (!modal.dataset.ready) { buildModal(); modal.dataset.ready = 'true'; }
    modal.hidden = false; status(muted ? 'Voice off' : 'Ready'); modal.querySelector('#proQuestion').focus();
  }

  function close() {
    stopListening(true);
    stopVoice();
    modal.hidden = true;
  }

  launchButton?.addEventListener('click', open);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) close(); });
})();