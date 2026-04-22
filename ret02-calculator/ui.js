// FULL REBUILD COMING FROM STABLE VERSION + FEATURES

window.ret02Ui = (() => {
  let chartInstance;

  const percentFields = ['inflation','desiredPct','preReturn','postReturn'];
  const currencyFields = ['currentIncome','spouseIncome','currentSavings'];
  const storageKey = 'ret02_scenarios';

  const currency = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
  const percent1 = new Intl.NumberFormat('en-US',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1});

  function formatPercent(v){return (v*100).toFixed(1).replace(/\.0$/,'')+'%'}
  function parsePercent(v){return Number(String(v).replace('%',''))/100||0}

  function formatCurrency(v){return currency.format(Number(v)||0)}
  function parseCurrency(v){return Number(String(v).replace(/[$,]/g,''))||0}

  function readInputs(){
    return {
      currentAge:+currentAge.value,
      spouseIncome:parseCurrency(spouseIncome.value),
      currentIncome:parseCurrency(currentIncome.value),
      currentSavings:parseCurrency(currentSavings.value),
      inflation:parsePercent(inflation.value),
      retireAge:+retireAge.value,
      retireYears:+retireYears.value,
      desiredPct:parsePercent(desiredPct.value),
      preReturn:parsePercent(preReturn.value),
      postReturn:parsePercent(postReturn.value),
      includeSS:includeSS.value,
      marital:marital.value
    }
  }

  function renderSoftWarnings(i){
    const w=[];
    if(i.preReturn>0.08) w.push('Pre-retirement return above 8% is aggressive');
    if(i.postReturn>0.06) w.push('Post-retirement return above 6% is aggressive');
    if(i.inflation>0.05) w.push('Inflation above 5% is high');
    const box=document.getElementById('softWarnings');
    if(!box) return;
    box.innerHTML=w.map(x=>`⚠ ${x}`).join('<br>');
    box.style.display=w.length?'block':'none';
  }

  function render(){
    const input=readInputs();
    renderSoftWarnings(input);

    const model=window.ret02Model.compute(input);

    primaryMessage.textContent = 'Results updated';
    waitMessage.textContent = '';

    renderChart(model);
  }

  function renderChart(model){
    const ctx=projectionChart.getContext('2d');
    if(chartInstance) chartInstance.destroy();

    chartInstance=new Chart(ctx,{
      type:'bar',
      data:{
        labels:model.rows.map(r=>r.age),
        datasets:[
          {type:'bar',label:'Desired Income',data:model.rows.map(r=>r.desiredIncome),backgroundColor:'rgba(79,70,229,0.5)'},
          {type:'bar',label:'Social Security',data:model.rows.map(r=>r.ssIncome),backgroundColor:'#059669'},
          {type:'line',label:'Ending Balance',data:model.rows.map(r=>r.endingBalance),borderColor:'#111827'}
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}
    });
  }

  function getStore(){return JSON.parse(localStorage.getItem(storageKey)||'{}')}

  function loadDropdown(){
    const s=getStore();
    scenarioSelect.innerHTML='<option value="">Select</option>'+Object.keys(s).map(k=>`<option>${k}</option>`).join('');
  }

  function saveScenario(name,input){
    if(!name) return;
    const s=getStore(); s[name]=input;
    localStorage.setItem(storageKey,JSON.stringify(s));
    loadDropdown();
  }

  function init(){
    loadDropdown();

    saveScenarioBtn.onclick=()=>saveScenario(scenarioName.value,readInputs());
    loadScenarioBtn.onclick=()=>{
      const s=getStore()[scenarioSelect.value];
      if(!s) return;
      Object.entries(s).forEach(([k,v])=>{
        const el=document.getElementById(k);
        if(!el) return;
        if(percentFields.includes(k)) el.value=formatPercent(v);
        else if(currencyFields.includes(k)) el.value=formatCurrency(v);
        else el.value=v;
      });
      render();
    }

    deleteScenarioBtn.onclick=()=>{
      const s=getStore(); delete s[scenarioSelect.value];
      localStorage.setItem(storageKey,JSON.stringify(s));
      loadDropdown();
    }

    document.querySelectorAll('input,select').forEach(el=>{
      el.addEventListener('blur',render);
      el.addEventListener('change',render);
    });

    render();
  }

  return {init};
})();