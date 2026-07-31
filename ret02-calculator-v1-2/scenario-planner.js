(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('aipro') !== 'on') return;

  const percentIds = new Set(['inflation','desiredPct','preReturn','postReturn']);
  const currencyIds = new Set(['currentIncome','spouseIncome','currentSavings']);
  const labels = {
    currentAge:'Current age', currentIncome:'Current gross annual income', spouseIncome:'Spouse annual income',
    currentSavings:'Current retirement savings', inflation:'Inflation / salary increase', retireAge:'Desired retirement age',
    retireYears:'Years of retirement income', desiredPct:'Income desired at retirement', preReturn:'Pre-retirement return',
    postReturn:'Post-retirement return', includeSS:'Include Social Security', marital:'Single or married'
  };

  let pendingScenario = null;

  const parseCurrency = value => Number(String(value ?? '').replace(/[$,\s]/g,'')) || 0;
  const parsePercent = value => (Number(String(value ?? '').replace('%','').trim()) || 0) / 100;
  const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value)||0);
  const pct = value => new Intl.NumberFormat('en-US',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(value)||0);

  function readInputs() {
    const get = id => document.getElementById(id)?.value ?? '';
    return {
      currentAge:Number(get('currentAge')), currentIncome:parseCurrency(get('currentIncome')),
      spouseIncome:parseCurrency(get('spouseIncome')), currentSavings:parseCurrency(get('currentSavings')),
      inflation:parsePercent(get('inflation')), retireAge:Number(get('retireAge')),
      retireYears:Number(get('retireYears')), desiredPct:parsePercent(get('desiredPct')),
      preReturn:parsePercent(get('preReturn')), postReturn:parsePercent(get('postReturn')),
      includeSS:String(get('includeSS')).trim().toUpperCase(), marital:String(get('marital')).trim().toUpperCase()
    };
  }

  function setCaption(html, error=false) {
    const box = document.getElementById('proCaption');
    if (!box) return;
    box.innerHTML = html;
    box.classList.toggle('is-error', error);
  }

  function setStatus(text) {
    const el = document.getElementById('proStatus');
    if (el) el.textContent = text;
  }

  function depletionAge(model) {
    const row = model.rows.find(r => r.endingBalance <= 0 && r.age >= model.rows[0].age);
    return row ? row.age : null;
  }

  function summarize(model) {
    return {
      endingBalance:model.finalRow?.endingBalance || 0,
      annualSave:model.currentAnnualSave || 0,
      savePct:model.currentSavePct || 0,
      monthlySave:(model.currentAnnualSave || 0) / 12,
      depletionAge:depletionAge(model)
    };
  }

  function signedMoney(value) {
    const sign = value > 0 ? '+' : value < 0 ? '−' : '';
    return `${sign}${money(Math.abs(value))}`;
  }

  function signedPct(value) {
    const sign = value > 0 ? '+' : value < 0 ? '−' : '';
    return `${sign}${pct(Math.abs(value))}`;
  }

  function validate(input) {
    if (!Number.isFinite(input.currentAge) || input.currentAge < 18 || input.currentAge > 90) return 'Current age must be from 18 to 90.';
    if (!Number.isFinite(input.retireAge) || input.retireAge <= input.currentAge || input.retireAge > 100) return 'Retirement age must be greater than current age and no more than 100.';
    if (!Number.isFinite(input.retireYears) || input.retireYears < 1 || input.retireYears > 50) return 'Years of retirement income must be from 1 to 50.';
    if (input.inflation < 0 || input.inflation > .15) return 'Inflation must be from 0% to 15%.';
    if (input.desiredPct < 0 || input.desiredPct > 1.5) return 'Desired retirement income must be from 0% to 150%.';
    if (input.preReturn < 0 || input.preReturn > .2 || input.postReturn < 0 || input.postReturn > .2) return 'Return assumptions must be from 0% to 20%.';
    if (input.currentIncome < 0 || input.spouseIncome < 0 || input.currentSavings < 0) return 'Currency values cannot be negative.';
    return '';
  }

  function extractNumber(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return Number(String(match[1]).replace(/,/g,''));
    }
    return null;
  }

  function parseScenarioRequest(text) {
    const q = text.toLowerCase();
    const changes = {};
    const mappings = [
      ['inflation', ['inflation']], ['retireAge', ['retire(?:ment)? age','retire at','retirement at']],
      ['retireYears', ['years? of retirement','retirement period']], ['desiredPct', ['income desired','replacement rate','retirement income']],
      ['preReturn', ['pre-retirement return','pre retirement return']], ['postReturn', ['post-retirement return','post retirement return']],
      ['currentSavings', ['current (?:retirement )?savings','retirement savings']], ['currentIncome', ['current (?:gross )?(?:annual )?income']],
      ['spouseIncome', ['spouse (?:annual )?income']], ['currentAge', ['current age']]
    ];

    for (const [id, phrases] of mappings) {
      for (const phrase of phrases) {
        if (!new RegExp(phrase).test(q)) continue;
        const isPercent = percentIds.has(id);
        const patterns = isPercent
          ? [new RegExp(`${phrase}[^0-9]{0,30}(?:to|at|of|=)?\\s*(\\d+(?:\\.\\d+)?)\\s*%`), new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%[^.]{0,30}${phrase}`)]
          : [new RegExp(`${phrase}[^0-9]{0,30}(?:to|at|of|=)?\\s*\\$?(\\d[\\d,]*(?:\\.\\d+)?)`), new RegExp(`\\$?(\\d[\\d,]*(?:\\.\\d+)?)[^.]{0,30}${phrase}`)];
        const value = extractNumber(q, patterns);
        if (value !== null) changes[id] = isPercent ? value / 100 : value;
        break;
      }
    }

    if (/exclude|without|remove|turn off/.test(q) && /social security/.test(q)) changes.includeSS = 'N';
    if (/include|with|turn on/.test(q) && /social security/.test(q)) changes.includeSS = 'Y';
    if (/\bsingle\b/.test(q)) changes.marital = 'S';
    if (/\bmarried\b/.test(q)) changes.marital = 'M';

    const intent = /(what if|rerun|re-run|recalculate|run the calculator|compare|scenario|change|increase|decrease|higher|lower|set|use)/.test(q);
    const mentionedField = mappings.some(([,phrases]) => phrases.some(p => new RegExp(p).test(q))) || /social security|single|married/.test(q);
    return { intent:intent && mentionedField, changes };
  }

  function formatChange(id, oldValue, newValue) {
    const display = value => percentIds.has(id) ? pct(value) : currencyIds.has(id) ? money(value) : String(value);
    return `${labels[id]}: ${display(oldValue)} → ${display(newValue)}`;
  }

  function comparisonHtml(baselineInput, scenarioInput, changes, baseline, scenario) {
    const changedRows = Object.keys(changes).map(id => `<li>${formatChange(id, baselineInput[id], scenarioInput[id])}</li>`).join('');
    const depletion = scenario.depletionAge
      ? `Assets first reach zero at age <strong>${scenario.depletionAge}</strong>${baseline.depletionAge ? ` (baseline: age ${baseline.depletionAge})` : ' (baseline did not reach zero during the projection)'}.`
      : `Assets do not reach zero during the selected projection${baseline.depletionAge ? `; the baseline reached zero at age ${baseline.depletionAge}` : ''}.`;
    return `
      <div class="pro-scenario-result">
        <h3>Temporary Scenario Comparison</h3>
        <ul class="pro-change-list">${changedRows}</ul>
        <div class="pro-comparison-grid">
          <div><span>Ending balance</span><strong>${money(scenario.endingBalance)}</strong><small>${signedMoney(scenario.endingBalance-baseline.endingBalance)} vs. current</small></div>
          <div><span>First-year annual savings</span><strong>${money(scenario.annualSave)}</strong><small>${signedMoney(scenario.annualSave-baseline.annualSave)} vs. current</small></div>
          <div><span>Savings rate</span><strong>${pct(scenario.savePct)}</strong><small>${signedPct(scenario.savePct-baseline.savePct)} vs. current</small></div>
          <div><span>Monthly savings</span><strong>${money(scenario.monthlySave)}</strong><small>${signedMoney(scenario.monthlySave-baseline.monthlySave)} vs. current</small></div>
        </div>
        <p>${depletion}</p>
        <p class="pro-scenario-note">This comparison was calculated with the same engine as the main calculator. Your visible inputs have not changed.</p>
        <div class="pro-scenario-actions">
          <button type="button" id="proApplyScenario">Apply Changes</button>
          <button type="button" id="proDiscardScenario" class="secondary">Discard</button>
        </div>
      </div>`;
  }

  function runScenario(changes) {
    const baselineInput = readInputs();
    const scenarioInput = {...baselineInput, ...changes};
    const error = validate(scenarioInput);
    if (error) { setCaption(`<p>${error}</p>`, true); setStatus('Needs revision'); return; }
    const baselineModel = window.ret02Model.compute(baselineInput);
    const scenarioModel = window.ret02Model.compute(scenarioInput);
    pendingScenario = { changes, input:scenarioInput };
    setCaption(comparisonHtml(baselineInput,scenarioInput,changes,summarize(baselineModel),summarize(scenarioModel)));
    setStatus('Comparison ready');
  }

  function applyPending() {
    if (!pendingScenario) return;
    for (const [id,value] of Object.entries(pendingScenario.changes)) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (percentIds.has(id)) el.value = `${(value*100).toFixed(1).replace(/\.0$/,'')}%`;
      else if (currencyIds.has(id)) el.value = money(value);
      else el.value = value;
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
    document.getElementById('calc-form')?.requestSubmit();
    setCaption('<p><strong>Changes applied.</strong> The main calculator has been recalculated and its chart and projection table now reflect the new assumptions.</p>');
    setStatus('Applied');
    pendingScenario = null;
  }

  function discardPending() {
    pendingScenario = null;
    setCaption('<p>The temporary scenario was discarded. The current calculator inputs remain unchanged.</p>');
    setStatus('Ready');
  }

  document.addEventListener('submit', event => {
    if (event.target?.id !== 'proChatForm') return;
    const input = document.getElementById('proQuestion');
    const text = input?.value.trim() || '';
    const parsed = parseScenarioRequest(text);
    if (!parsed.intent) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!Object.keys(parsed.changes).length) {
      setCaption('<p>I can run a temporary comparison, but I need a specific value. For example: <strong>“Set inflation to 4% and compare it with my current plan.”</strong></p>');
      setStatus('Need a value');
      return;
    }
    input.value = '';
    setStatus('Calculating…');
    runScenario(parsed.changes);
  }, true);

  document.addEventListener('click', event => {
    if (event.target?.id === 'proApplyScenario') applyPending();
    if (event.target?.id === 'proDiscardScenario') discardPending();
  });
})();