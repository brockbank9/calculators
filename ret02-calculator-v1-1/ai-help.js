(() => {
  const enabled = new URLSearchParams(window.location.search).get('aiassist') === 'on';
  if (!enabled) return;
  document.body.classList.add('ai-enabled');

  const fields = {
    currentAge:{label:'Current age',use:'Determines how many years remain before retirement and the starting age of the projection.',range:'18 to 90',value:'45',guidance:'Use your current age.'},
    currentIncome:{label:'Current gross annual income',use:'Provides the base for estimating retirement income needs and annual savings amounts.',range:'$0 or more',value:'$200,000',guidance:'Use current annual gross income before taxes.'},
    spouseIncome:{label:'Spouse annual income',use:'Adds household income when the calculator evaluates a married household.',range:'$0 or more',value:'$0',guidance:'Use current annual gross income for a spouse, or $0 when not applicable.'},
    currentSavings:{label:'Current retirement savings',use:'Sets the beginning retirement account balance that compounds before and after retirement.',range:'$0 or more',value:'$200,000',guidance:'Include retirement assets intended to support retirement income.'},
    inflation:{label:'Inflation / salary increase',use:'Increases salary and desired retirement income over time, affecting future purchasing power.',range:'0% to 15%',value:'3%',guidance:'A planning assumption near 2%–4% is commonly used for long-range illustrations.'},
    retireAge:{label:'Desired retirement age',use:'Determines when employment income and savings contributions end and retirement withdrawals begin.',range:'Greater than current age, up to 100',value:'65',guidance:'Use the age when you expect retirement income withdrawals to begin.'},
    retireYears:{label:'Years of retirement income',use:'Controls the length of the retirement projection and how long assets must support withdrawals.',range:'1 to 50 years',value:'20',guidance:'Consider life expectancy, health, and a margin for longevity.'},
    desiredPct:{label:'Income desired at retirement',use:'Calculates desired retirement income as a percentage of projected employment income.',range:'0% to 150%',value:'80%',guidance:'Many planning illustrations begin around 70%–90%, then adjust for expected spending.'},
    preReturn:{label:'Pre-retirement return',use:'Compounds retirement savings during the years before retirement.',range:'0% to 20%',value:'6%',guidance:'Use a long-term assumption consistent with your investment mix and tolerance for uncertainty.'},
    postReturn:{label:'Post-retirement return',use:'Compounds the retirement balance after retirement before withdrawals are applied.',range:'0% to 20%',value:'4%',guidance:'A conservative planning range is often lower than the pre-retirement return assumption.'},
    includeSS:{label:'Include Social Security',use:'Controls whether estimated Social Security income reduces the amount withdrawn from savings.',range:'Y or N',value:'Y',guidance:'Select Y when the projection should include estimated Social Security income.'},
    marital:{label:'Single or married',use:'Affects the Social Security income calculation and household-income assumptions.',range:'S or M',value:'M',guidance:'Choose the household status used for this retirement projection.'}
  };

  const modal=document.getElementById('aiModal'), title=document.getElementById('aiDialogTitle'), conversation=document.getElementById('aiConversation'), question=document.getElementById('aiQuestion'), form=document.getElementById('aiChatForm'), suggestionBar=document.getElementById('aiSuggestionBar'), suggestedValue=document.getElementById('aiSuggestedValue'), useButton=document.getElementById('useSuggestionBtn');
  let activeField=null;
  let resultsContext='';
  const escapeHtml=text=>String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const currentValue=id=>document.getElementById(id)?.value||'';
  const cleanText=id=>(document.getElementById(id)?.innerText||'').replace(/\s+/g,' ').trim();
  function assistantMessage(html){conversation.insertAdjacentHTML('beforeend',`<div class="ai-message assistant">${html}</div>`);conversation.scrollTop=conversation.scrollHeight;}
  function collectResultsContext(){
    const primary=cleanText('primaryMessage');
    const wait=cleanText('waitMessage');
    const metrics=cleanText('metrics');
    const rows=[...document.querySelectorAll('#projectionTable tbody tr')];
    const first=rows[0]?.innerText.replace(/\s+/g,' ').trim()||'';
    const last=rows[rows.length-1]?.innerText.replace(/\s+/g,' ').trim()||'';
    return [primary,wait,metrics,first&&`First projection row: ${first}`,last&&`Final projection row: ${last}`].filter(Boolean).join('\n');
  }
  function openResultsAssistant(){
    activeField='resultsSummary';
    resultsContext=collectResultsContext();
    title.textContent='Results explanation';
    conversation.innerHTML='';
    suggestionBar.hidden=true;
    const summary=resultsContext||'No calculated result is available yet. Recalculate the plan, then reopen the Results Assistant.';
    assistantMessage(`<h3>Your calculated results</h3><p>I can explain the result paragraph, key figures, chart pattern, and year-by-year projection in more detail.</p><div class="ai-results-context">${escapeHtml(summary).replace(/\n/g,'<br>')}</div><p><strong>Questions you can ask:</strong> Why is there a shortfall? What drives the ending balance? What changes would have the largest effect? How should I read the chart?</p>`);
    modal.hidden=false;
    question.focus();
  }
  function openAssistant(id){
    if(id==='resultsSummary'){openResultsAssistant();return;}
    activeField=id;
    const field=fields[id];
    if(!field)return;
    title.textContent=field.label;
    conversation.innerHTML='';
    assistantMessage(`<h3>${escapeHtml(field.label)}</h3><p><strong>Current entry:</strong> ${escapeHtml(currentValue(id))}</p><p>${escapeHtml(field.use)}</p><p><strong>Allowed range:</strong> ${escapeHtml(field.range)}</p><p><strong>Educational planning context:</strong> ${escapeHtml(field.guidance)}</p>${id==='postReturn'?'<div class="ai-range"><span>Conservative<br><strong>3%–4%</strong></span><span>Moderate<br><strong>4%–5%</strong></span><span>Higher assumption<br><strong>5%–6%</strong></span></div>':''}<p style="margin-top:12px"><strong>You may wish to consider:</strong> ${escapeHtml(field.value)}. Review whether that value matches your circumstances and assumptions.</p>`);
    suggestedValue.textContent=`Illustrative value: ${field.value}`;
    suggestionBar.hidden=false;
    modal.hidden=false;
    question.focus();
  }
  function closeAssistant(){modal.hidden=true;activeField=null;resultsContext='';}
  function resultsReply(text){
    const q=text.toLowerCase();
    if(!resultsContext)return'No calculated result is available yet. Recalculate the plan and reopen the Results Assistant.';
    if(q.includes('shortfall')||q.includes('enough')||q.includes('success'))return'The result paragraph compares the projected resources available with the income goal created by your assumptions. A shortfall generally means projected savings, growth, Social Security, or the retirement timeline are not sufficient to support the selected income target for the full retirement period. The projection is an illustration, not a guarantee.';
    if(q.includes('chart'))return'The chart shows how the projected retirement balance changes over time. The upward portion generally reflects contributions and investment growth before retirement. After retirement, withdrawals begin, so the balance may flatten or decline depending on returns, inflation, Social Security, and the income target.';
    if(q.includes('table')||q.includes('year'))return'The year-by-year table is the detailed calculation behind the chart. Read across each row to see the age, projected income, contributions or withdrawals, investment growth, and ending balance for that year. The final rows help show whether the plan retains assets through the selected retirement period.';
    if(q.includes('improve')||q.includes('change')||q.includes('largest')||q.includes('better'))return'Common changes that can materially affect the illustration include retiring later, increasing current savings or annual contributions, reducing the retirement-income target, extending or shortening the retirement period, and changing return or inflation assumptions. Testing one change at a time makes the effect easier to understand.';
    if(q.includes('social security'))return'When Social Security is included, the estimated benefit offsets part of the desired retirement income, reducing the amount that must be withdrawn from savings. The result remains sensitive to the benefit estimate and the age at which income begins.';
    return`I am using the current result paragraph, displayed metrics, and the first and final projection rows as context. For this scripted prototype, I can explain the shortfall or surplus, chart, year-by-year table, Social Security effect, and which assumptions commonly have the greatest impact. Your current displayed context is: ${resultsContext}`;
  }
  function replyFor(text){
    if(activeField==='resultsSummary')return resultsReply(text);
    const q=text.toLowerCase(),field=fields[activeField];
    if(q.includes('why')&&q.includes('8'))return'An 8% assumption may reflect a stock-heavy historical average, but retirement projections are sensitive to market timing and sequence-of-returns risk. A lower illustration can provide a more conservative stress test. Actual returns remain uncertain.';
    if(q.includes('inflation'))return'Inflation reduces purchasing power. In this calculator, inflation also increases future salary and desired retirement income. When post-retirement return is below inflation, the portfolio may lose purchasing power even when its dollar balance grows.';
    if(q.includes('range')||q.includes('limit'))return`The calculator accepts ${field.range}. The range prevents invalid entries, but a valid entry is not automatically appropriate for every user.`;
    if(q.includes('change')||q.includes('result'))return`${field.label} affects the projection because it ${field.use.charAt(0).toLowerCase()}${field.use.slice(1)} Changing it can alter required savings, withdrawals, and ending balances.`;
    return`For this prototype, I can explain how ${field.label.toLowerCase()} is used, its allowed range, and general educational planning considerations. A production version would securely send your question and calculator context to an AI service.`;
  }
  document.querySelectorAll('.ai-help-icon').forEach(button=>button.addEventListener('click',()=>openAssistant(button.dataset.field)));
  document.querySelectorAll('[data-close-ai]').forEach(button=>button.addEventListener('click',closeAssistant));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)closeAssistant();});
  form.addEventListener('submit',event=>{event.preventDefault();const text=question.value.trim();if(!text||!activeField)return;conversation.insertAdjacentHTML('beforeend',`<div class="ai-message user">${escapeHtml(text)}</div>`);question.value='';window.setTimeout(()=>assistantMessage(`<p>${escapeHtml(replyFor(text))}</p>`),250);});
  useButton.addEventListener('click',()=>{if(!activeField||activeField==='resultsSummary')return;const input=document.getElementById(activeField);input.value=fields[activeField].value;input.dispatchEvent(new Event('change',{bubbles:true}));assistantMessage(`<p>The illustrative value <strong>${escapeHtml(fields[activeField].value)}</strong> was inserted. You remain responsible for reviewing and changing the entry.</p>`);});
})();