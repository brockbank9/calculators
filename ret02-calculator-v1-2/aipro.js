(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('aipro') !== 'on') return;

  document.body.classList.add('aipro-enabled');

  const chatEndpoint = params.get('aiendpoint') || 'https://retirement-assistant.brockbank.workers.dev/chat';
  const speechEndpoint = params.get('aiprovoiceendpoint') || chatEndpoint.replace(/\/chat$/, '/speech');
  const launchButton = document.getElementById('askProBtn');
  const modal = document.getElementById('proPreview');
  const inputIds = ['currentAge','currentIncome','spouseIncome','currentSavings','inflation','retireAge','retireYears','desiredPct','preReturn','postReturn','includeSS','marital'];

  let history = [];
  let busy = false;
  let muted = false;
  let audio = null;
  let audioUrl = '';
  let lastAnswer = '';

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
        <button type="button" class="pro-preview-close" data-close-pro aria-label="Close Ask a Pro">×</button>
        <header class="pro-titlebar">
          <div><p class="pro-kicker">AI Pro</p><h2 id="proTitle">Ask a Pro</h2></div>
          <span id="proStatus" class="pro-status" aria-live="polite">Ready</span>
        </header>
        <div class="pro-stage">
          <div id="proAvatar" class="pro-avatar-figure" role="img" aria-label="Animated professional AI presenter">
            <div class="pro-hair"></div><div class="pro-ear left"></div><div class="pro-ear right"></div>
            <div class="pro-face"><span class="pro-eye left"></span><span class="pro-eye right"></span><span class="pro-nose"></span><span class="pro-mouth"></span></div>
            <div class="pro-neck"></div><div class="pro-shirt"></div><div class="pro-jacket"></div><div class="pro-tie"></div>
          </div>
          <div id="proCaption" class="pro-caption" aria-live="polite">Ask a question about the current calculator inputs or generated results.</div>
          <div class="pro-controls">
            <button id="proMute" type="button" class="pro-control">🔊 Voice on</button>
            <button id="proReplay" type="button" class="pro-control" disabled>↻ Replay</button>
          </div>
        </div>
        <form id="proChatForm" class="pro-chat-form">
          <input id="proQuestion" type="text" maxlength="1200" placeholder="Ask about this retirement projection…" autocomplete="off">
          <button type="submit">Ask</button>
        </form>
        <p class="pro-disclaimer">AI Pro is an educational presentation feature, not a financial professional. It does not provide financial, investment, tax, legal, insurance, or estate-planning advice. The voice is AI-generated.</p>
      </section>`;

    modal.querySelectorAll('[data-close-pro]').forEach(element => element.addEventListener('click', close));
    modal.querySelector('#proChatForm').addEventListener('submit', submitQuestion);
    modal.querySelector('#proMute').addEventListener('click', toggleMute);
    modal.querySelector('#proReplay').addEventListener('click', () => speak(lastAnswer));
  }

  function status(text) { const element = modal.querySelector('#proStatus'); if (element) element.textContent = text; }
  function caption(text, error = false) { const element = modal.querySelector('#proCaption'); if (element) { element.textContent = text; element.classList.toggle('is-error', error); } }
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
    utterance.pitch = 0.96;
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

  async function liveAnswer(question) {
    const response = await fetch(chatEndpoint, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ question, mode:'pro', calculatorContext:calculatorContext(), conversation:history.slice(-6) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.answer) throw new Error(data.error || 'AI Pro is temporarily unavailable.');
    return data.answer;
  }

  async function submitQuestion(event) {
    event.preventDefault();
    if (busy) return;
    const input = modal.querySelector('#proQuestion');
    const question = input.value.trim();
    if (!question) return;

    busy = true; input.disabled = true; modal.querySelector('#proChatForm button').disabled = true;
    stopVoice(); caption(`You asked: ${question}`); status('Thinking…');
    try {
      const answer = await liveAnswer(question);
      history.push({role:'user',content:question},{role:'assistant',content:answer});
      history = history.slice(-8); lastAnswer = answer;
      caption(answer); modal.querySelector('#proReplay').disabled = false;
      await speak(answer);
    } catch (error) { caption(error.message || 'AI Pro is temporarily unavailable.', true); status('Unavailable'); }
    finally { busy = false; input.disabled = false; modal.querySelector('#proChatForm button').disabled = false; input.value = ''; input.focus(); }
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

  function close() { stopVoice(); modal.hidden = true; }

  launchButton?.addEventListener('click', open);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) close(); });
})();