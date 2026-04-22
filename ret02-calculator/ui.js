// RESTORED UI WITH WARNINGS + SCENARIOS (clean integration)

window.ret02Ui = (() => {
  let chartInstance;
  const percentFields = ['inflation', 'desiredPct', 'preReturn', 'postReturn'];
  const currencyFields = ['currentIncome', 'spouseIncome', 'currentSavings'];

  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  function parsePercentInput(v){return Number(String(v).replace('%',''))/100||0}
  function parseCurrencyInput(v){return Number(String(v).replace(/[$,]/g,''))||0}

  function readInputs(){
    return {
      currentAge:+currentAge.value,
      spouseIncome:parseCurrencyInput(spouseIncome.value),
      currentIncome:parseCurrencyInput(currentIncome.value),
      currentSavings:parseCurrencyInput(currentSavings.value),
      inflation:parsePercentInput(inflation.value),
      retireAge:+retireAge.value,
      retireYears:+retireYears.value,
      desiredPct:parsePercentInput(desiredPct.value),
      preReturn:parsePercentInput(preReturn.value),
      postReturn:parsePercentInput(postReturn.value),
      includeSS:includeSS.value,
      marital:marital.value
    }
  }

  function renderSoftWarnings(input){
    const w=[];
    if(input.preReturn>0.08) w.push('Pre-return above 8% is aggressive');
    if(input.postReturn>0.06) w.push('Post-return above 6% is aggressive');
    if(input.inflation>0.05) w.push('Inflation above 5% is high');
    const box=document.getElementById('softWarnings');
    if(!box) return;
    box.innerHTML=w.map(x=>`⚠ ${x}`).join('<br>');
    box.style.display=w.length?'block':'none';
  }

  function render(){
    const input=readInputs();
    renderSoftWarnings(input);
    const model=window.ret02Model.compute(input);

    primaryMessage.textContent='';
    waitMessage.textContent='';

    renderChart(model);
  }

  function renderChart(model){
    const ctx=projectionChart.getContext('2d');
    if(chartInstance) chartInstance.destroy();
    chartInstance=new Chart(ctx,{type:'line',data:{labels:model.rows.map(r=>r.age),datasets:[{label:'Ending Balance',data:model.rows.map(r=>r.endingBalance)}]}});
  }

  function getStore(){return JSON.parse(localStorage.getItem('ret02_scenarios')||'{}')}

  function saveScenario(name,input){
    const s=getStore();s[name]=input;
    localStorage.setItem('ret02_scenarios',JSON.stringify(s));
    loadDropdown();
  }

  function loadDropdown(){
    const s=getStore();
    scenarioSelect.innerHTML='<option></option>'+Object.keys(s).map(k=>`<option>${k}</option>`).join('');
  }

  function init(){
    loadDropdown();

    saveScenarioBtn.onclick=()=>saveScenario(scenarioName.value,readInputs());
    loadScenarioBtn.onclick=()=>{const s=getStore()[scenarioSelect.value];if(!s)return;Object.entries(s).forEach(([k,v])=>{document.getElementById(k).value=v});render()}
    deleteScenarioBtn.onclick=()=>{const s=getStore();delete s[scenarioSelect.value];localStorage.setItem('ret02_scenarios',JSON.stringify(s));loadDropdown()}

    document.querySelectorAll('input,select').forEach(el=>{
      el.addEventListener('change',render);
      el.addEventListener('blur',render);
    });

    render();
  }

  return {init};
})();