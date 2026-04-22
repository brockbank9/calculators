window.ret02Ui = (() => {
  let chartInstance;

  const percentFields = ['inflation','desiredPct','preReturn','postReturn'];

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

  function formatPercentDisplay(value) {
    return (value * 100).toFixed(1).replace(/\.0$/, '') + '%';
  }

  function parsePercentInput(value) {
    return Number(String(value).replace('%','')) / 100;
  }

  function fillDefaults() {
    Object.entries(defaults).forEach(([key, value]) => {
      const el = document.getElementById(key);
      if (percentFields.includes(key)) {
        el.value = formatPercentDisplay(value);
      } else {
        el.value = value;
      }
    });
  }

  function readInputs() {
    return {
      currentAge: Number(document.getElementById("currentAge").value),
      spouseIncome: Number(document.getElementById("spouseIncome").value),
      currentIncome: Number(document.getElementById("currentIncome").value),
      currentSavings: Number(document.getElementById("currentSavings").value),
      inflation: parsePercentInput(document.getElementById("inflation").value),
      retireAge: Number(document.getElementById("retireAge").value),
      retireYears: Number(document.getElementById("retireYears").value),
      desiredPct: parsePercentInput(document.getElementById("desiredPct").value),
      preReturn: parsePercentInput(document.getElementById("preReturn").value),
      postReturn: parsePercentInput(document.getElementById("postReturn").value),
      includeSS: document.getElementById("includeSS").value.trim().toUpperCase(),
      marital: document.getElementById("marital").value.trim().toUpperCase()
    };
  }

  function bindPercentFormatting() {
    percentFields.forEach(id => {
      const el = document.getElementById(id);

      el.addEventListener('focus', () => {
        el.value = el.value.replace('%','');
      });

      el.addEventListener('blur', () => {
        const val = parsePercentInput(el.value || 0);
        el.value = formatPercentDisplay(val);
      });
    });
  }

  function render() {
    const input = readInputs();
    const model = window.ret02Model.compute(input);
    renderMessages(model, input);
    renderTable(model, input);
    renderChart(model);
  }

  function init() {
    fillDefaults();
    bindPercentFormatting();
    render();

    document.querySelectorAll("#calc-form input, #calc-form select").forEach((el) => {
      el.addEventListener("blur", render);
      el.addEventListener("change", render);
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      fillDefaults();
      render();
    });
  }

  return { init };
})();