(() => {
  const params = new URLSearchParams(window.location.search);
  const enabled = params.get('aiassist') === 'on';
  if (!enabled) return;

  document.body.classList.add('ai-enabled');

  const fields = {
    currentAge: { label:'Current age', use:'Determines how many years remain before retirement and the starting age of the projection.', range:'18 to 90', value:'45', guidance:'Use your current age.' },
    currentIncome: { label:'Current gross annual income', use:'Provides the base for estimating retirement income needs and annual savings amounts.', range:'$0 or more', value:'$200,000', guidance:'Use current annual gross income before taxes.' },
    spouseIncome: { label:'Spouse annual income', use:'Adds household income when the calculator evaluates a married household.', range:'$0 or more', value:'$0', guidance:'Use current annual gross income for a spouse, or $0 when not applicable.' },
    currentSavings: { label:'Current retirement savings', use:'Sets the beginning retirement account balance that compounds before and after retirement.', range:'$0 or more', value:'$200,000', guidance:'Include retirement assets intended to support retirement income.' },
    inflation: { label:'Inflation / salary increase', use:'Increases salary and desired retirement income over time, affecting future purchasing power.', range:'0% to 15%', value:'3%', guidance:'A planning assumption near 2%–4% is commonly used for long-range illustrations.' },
    retireAge: { label:'Desired retirement age', use:'Determines when employment income and savings contributions end and retirement withdrawals begin.', range:'Greater than current age, up to 100', value:'65', guidance:'Use the age when you expect retirement income withdrawals to begin.' },
    retireYears: { label:'Years of retirement income', use:'Controls the length of the retirement projection and how long assets must support withdrawals.', range:'1 to 50 years', value:'20', guidance:'Consider life expectancy, health, and a margin for longevity.' },
    desiredPct: { label:'Income desired at retirement', use:'Calculates desired retirement income as a percentage of projected employment income.', range:'0% to 150%', value:'80%', guidance:'Many planning illustrations begin around 70%–90%, then adjust for expected spending.' },
    preReturn: { label:'Pre-retirement return', use:'Compounds retirement savings during the years before retirement.', range:'0% to 20%', value:'6%', guidance:'Use a long-term assumption consistent with your investment mix and tolerance for uncertainty.' },
    postReturn: { label:'Post-retirement return', use:'Compounds the retirement balance after retirement before withdrawals are applied.', range:'0% to 20%', value:'4%', guidance:'A conservative planning range is often lower than the pre-retirement return assumption.' },
    includeSS: { label:'Include Social Security', use:'Controls whether estimated Social Security income reduces the amount withdrawn from savings.', range:'Y or N', value:'Y', guidance:'Select Y when the projection should include estimated Social Security income.' },
    marital: { label:'Single or married', use:'Affects the Social Security income calculation and household-income assumptions.', range:'S or M', value:'M', guidance:'Choose the household status used for this retirement projection.' }
  };

  const modal = document.getElementById('aiModal');
  const title = document.getElementById('aiDialogTitle');
  const conversation = document.getElementById('aiConversation');
  const question = document.getElementById('aiQuestion');
  const form = document.getElementById('aiChatForm');
  const suggestionBar = document.getElementById('aiSuggestionBar');
  const suggestedValue = document.getElementById('aiSuggestedValue');
  const useButton = document.getElementById('useSuggestionBtn');
  let activeField = null;

  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));

  function currentValue(id) {
    return document.getElementById(id)?.value || '';
  }

  function assistantMessage(html) {
    conversation.insertAdjacentHTML('beforeend', `<div class="ai-message assistant">${html}</div>`);
    conversation.scrollTop = conversation.scrollHeight;
  }

  function openAssistant(id) {
    activeField = id;
    const field = fields[id];
    if (!field) return;
    title.textContent = field.label;
    conversation.innerHTML = '';
    assistantMessage(`
      <h3>${escapeHtml(field.label)}</h3>
      <p><strong>Current entry:</strong> ${escapeHtml(currentValue(id))}</p>
      <p>${escapeHtml(field.use)}</p>
      <p><strong>Allowed range:</strong> ${escapeHtml(field.range)}</p>
      <p><strong>Educational planning context:</strong> ${escapeHtml(field.guidance)}</p>
      ${id === 'postReturn' ? '<div class="ai-range"><span>Conservative<br><strong>3%–4%</strong></span><span>Moderate<br><strong>4%–5%</strong></span><span>Higher assumption<br><strong>5%–6%</strong></span></div>' : ''}
      <p style="margin-top:12px"><strong>You may wish to consider:</strong> ${escapeHtml(field.value)}. Review whether that value matches your own circumstances and planning assumptions.</p>`);
    suggestedValue.textContent = `Illustrative value: ${field.value}`;
    suggestionBar.hidden = false;
    modal.hidden = false;
    question.focus();
  }

  function closeAssistant() {
    modal.hidden = true;
    activeField = null;
  }

  function replyFor(text) {
    const q = text.toLowerCase();
    const field = fields[activeField];
    if (q.includes('why') && q.includes('8')) return 'An 8% assumption may reflect a stock-heavy historical average, but retirement projections are sensitive to market timing and sequence-of-returns risk. A lower illustration can provide a more conservative stress test. Actual returns remain uncertain.';
    if (q.includes('inflation')) return 'Inflation reduces purchasing power. In this calculator, inflation also increases future salary and desired retirement income. When post-retirement return is below inflation, the portfolio may lose purchasing power even when its dollar balance grows.';
    if (q.includes('range') || q.includes('limit')) return `The calculator accepts ${field.range}. The range prevents invalid entries, but a valid entry is not automatically an appropriate assumption for every user.`;
    if (q.includes('change') || q.includes('result')) return `${field.label} affects the projection because it ${field.use.charAt(0).toLowerCase()}${field.use.slice(1)} Changing it can alter required savings, withdrawals, and ending balances.`;
    return `For this prototype, I can explain how ${field.label.toLowerCase()} is used, its allowed range, and general educational planning considerations. A production version would securely send your follow-up question and calculator context to OpenAI.`;
  }

  document.querySelectorAll('.ai-help-icon').forEach(button => button.addEventListener('click', () => openAssistant(button.dataset.field)));
  document.querySelectorAll('[data-close-ai]').forEach(button => button.addEventListener('click', closeAssistant));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeAssistant(); });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = question.value.trim();
    if (!text || !activeField) return;
    conversation.insertAdjacentHTML('beforeend', `<div class="ai-message user">${escapeHtml(text)}</div>`);
    question.value = '';
    window.setTimeout(() => assistantMessage(`<p>${escapeHtml(replyFor(text))}</p>`), 250);
  });

  useButton.addEventListener('click', () => {
    if (!activeField) return;
    const input = document.getElementById(activeField);
    input.value = fields[activeField].value;
    input.dispatchEvent(new Event('change', { bubbles:true }));
    assistantMessage(`<p>The illustrative value <strong>${escapeHtml(fields[activeField].value)}</strong> was inserted. You remain responsible for reviewing and changing the entry.</p>`);
  });
})();