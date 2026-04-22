window.ret02Ui = (() => {
  let chartInstance;

  const defaults = {
    currentAge: 45,
    spouseIncome: 0,
    currentIncome: 200000,
    currentSavings: 200000,
    inflation: 0.03,
    retireAge: 65,
    retireYears: 20,
    desiredPct: 0.8,
    preReturn: 0.06,
    postReturn: 0.04,
    includeSS: "Y",
    marital: "M"
  };

  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const percent1 = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function fillDefaults() {
    Object.entries(defaults).forEach(([key, value]) => {
      document.getElementById(key).value = value;
    });
  }

  function readInputs() {
    return {
      currentAge: Number(document.getElementById("currentAge").value),
      spouseIncome: Number(document.getElementById("spouseIncome").value),
      currentIncome: Number(document.getElementById("currentIncome").value),
      currentSavings: Number(document.getElementById("currentSavings").value),
      inflation: Number(document.getElementById("inflation").value),
      retireAge: Number(document.getElementById("retireAge").value),
      retireYears: Number(document.getElementById("retireYears").value),
      desiredPct: Number(document.getElementById("desiredPct").value),
      preReturn: Number(document.getElementById("preReturn").value),
      postReturn: Number(document.getElementById("postReturn").value),
      includeSS: document.getElementById("includeSS").value.trim().toUpperCase(),
      marital: document.getElementById("marital").value.trim().toUpperCase()
    };
  }

  function renderMessages(model, input) {
    const ageMessage = Math.round(input.currentAge + model.yearsUntilRetirement + model.yearsOfRetirement);

    const ResultsParagraph1 = model.currentSavePct < 0
      ? `Congratulations!!! It appears that you have saved enough to meet your goal. At age ${ageMessage} you will still have ${currency.format(model.finalRow.endingBalance)}.`
      : `You need to save ${percent1.format(model.currentSavePct)} of your income. That equals ${currency.format(model.currentAnnualSave)} this year.`;

    const ResultsParagraph2 = model.yearsUntilRetirement < 2 || model.currentSavePct < 0 || model.waitSavePct === 0
      ? ""
      : `Waiting one year increases savings to ${percent1.format(model.waitSavePct)} (${currency.format(model.waitAnnualSave)}).`;

    document.getElementById("primaryMessage").textContent = ResultsParagraph1;
    document.getElementById("waitMessage").textContent = ResultsParagraph2;
    document.getElementById("metrics").innerHTML = "";
  }

  function renderChart(model) {
    const ctx = document.getElementById("projectionChart").getContext("2d");

    const labels = model.rows.map(r => r.age);

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Desired Income',
            data: model.rows.map(r => r.desiredIncome),
            backgroundColor: '#4f46e5',
            stack: 'income'
          },
          {
            type: 'bar',
            label: 'Social Security Income',
            data: model.rows.map(r => r.ssIncome),
            backgroundColor: '#059669',
            stack: 'income'
          },
          {
            type: 'line',
            label: 'Ending Balance',
            data: model.rows.map(r => r.endingBalance),
            borderColor: '#111827',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Retirement Analysis' }
        },
        scales: {
          x: { title: { display: true, text: 'Age' } },
          y: {
            stacked: true,
            ticks: { callback: v => '$' + v.toLocaleString() }
          }
        }
      }
    });
  }

  function render() {
    const input = readInputs();
    const model = window.ret02Model.compute(input);
    renderMessages(model, input);
    renderChart(model);
  }

  function bindAutoRecalculate() {
    document.querySelectorAll("#calc-form input, #calc-form select").forEach(el => {
      el.addEventListener("blur", render);
      el.addEventListener("change", render);
    });
  }

  function init() {
    fillDefaults();
    render();
    bindAutoRecalculate();
    document.getElementById("resetBtn").addEventListener("click", () => { fillDefaults(); render(); });
  }

  return { init };
})();