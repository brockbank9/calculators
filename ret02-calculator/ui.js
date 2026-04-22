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

  function fmtCurrency(value, showSymbol = false) {
    const rounded = Math.round(value);
    const formatted = Math.abs(rounded).toLocaleString("en-US");
    const prefix = rounded < 0 ? "-" : "";
    const dollar = showSymbol ? "$" : "";
    return `${prefix}${dollar}${formatted}`;
  }

  function renderMessages(model, input) {
    const ageMessage = Math.round(input.currentAge + model.yearsUntilRetirement + model.yearsOfRetirement);

    const ResultsParagraph1 = model.currentSavePct < 0
      ? `Congratulations!!! It appears that you have saved enough to meet your goal. In fact, it appears that at age ${ageMessage} you will still have ${currency.format(model.finalRow.endingBalance)} in your retirement accounts.`
      : `To provide the inflation-adjusted retirement income you desire, you will need to save ${percent1.format(model.currentSavePct)} of your yearly income (less any employer match, if applicable). This year, for example, the amount would be ${currency.format(model.currentAnnualSave)} or ${currency.format(model.currentAnnualSave / 12)} a month.`;

    const ResultsParagraph2 = model.yearsUntilRetirement < 2 || model.currentSavePct < 0 || model.waitSavePct === 0
      ? ""
      : `If you wait just one year to start saving for retirement you will need to save ${percent1.format(model.waitSavePct)} of your annual income, which amounts to ${currency.format(model.waitAnnualSave)} in the first year. Save Now and Save Less!!!`;

    document.getElementById("primaryMessage").textContent = ResultsParagraph1;
    document.getElementById("waitMessage").textContent = ResultsParagraph2;
    document.getElementById("metrics").innerHTML = "";
  }

  function moneyCell(value, showSymbol, extraClass = "") {
    const negative = value < 0 ? ' negative' : '';
    return `<td class="money${negative}${extraClass ? ` ${extraClass}` : ""}">${fmtCurrency(value, showSymbol)}</td>`;
  }

  function withdrawalCell(value, showSymbol) {
    const colorClass = value > 0 ? ' positive-withdrawal' : value < 0 ? ' negative-withdrawal' : '';
    return moneyCell(value, showSymbol, colorClass);
  }

  function renderTable(model, input) {
    document.querySelector("#projectionTable thead").innerHTML = `
      <tr>
        <th>Year</th>
        <th>Age</th>
        <th>Salary</th>
        <th>Beginning Balance</th>
        <th>Interest</th>
        <th>Savings</th>
        <th>Desired Income</th>
        <th>Social Security</th>
        <th>Withdrawals</th>
        <th>Ending Balance</th>
      </tr>`;

    document.querySelector("#projectionTable tbody").innerHTML = model.rows.map((row, index) => {
      const showSymbol = index === 0;
      const retireClass = row.age === input.retireAge ? ' class="retirement-row"' : '';
      return `
        <tr${retireClass}>
          <td class="text-center">${row.year}</td>
          <td class="text-center">${row.age}</td>
          ${moneyCell(row.salary, showSymbol)}
          ${moneyCell(row.beginningBalance, showSymbol)}
          ${moneyCell(row.interest, showSymbol)}
          ${moneyCell(row.savings, showSymbol)}
          ${moneyCell(row.desiredIncome, showSymbol)}
          ${moneyCell(row.ssIncome, showSymbol)}
          ${withdrawalCell(row.withdrawals, showSymbol)}
          ${moneyCell(row.endingBalance, showSymbol)}
        </tr>`;
    }).join("");
  }

  function renderChart(model) {
    const ctx = document.getElementById("projectionChart").getContext("2d");
    const labels = model.rows.map((r) => r.age);

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Desired Income',
            data: model.rows.map((r) => r.desiredIncome),
            backgroundColor: 'rgba(79, 70, 229, 0.5)',
            borderColor: '#4f46e5',
            borderWidth: 1,
            grouped: false,
            order: 3,
            categoryPercentage: 0.9,
            barPercentage: 0.9
          },
          {
            type: 'bar',
            label: 'Social Security Income',
            data: model.rows.map((r) => r.ssIncome),
            backgroundColor: '#059669',
            borderColor: '#059669',
            borderWidth: 0,
            grouped: false,
            order: 2,
            categoryPercentage: 0.9,
            barPercentage: 0.9
          },
          {
            type: 'line',
            label: 'Ending Balance',
            data: model.rows.map((r) => r.endingBalance),
            borderColor: '#111827',
            backgroundColor: '#111827',
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Retirement Analysis' },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${currency.format(context.raw)}`
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            title: { display: true, text: 'Age' },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 12
            },
            grid: {
              display: false
            }
          },
          y: {
            stacked: false,
            beginAtZero: true,
            ticks: {
              callback: (value) => currency.format(value)
            }
          }
        }
      }
    });
  }

  function render() {
    const input = readInputs();
    const model = window.ret02Model.compute(input);
    renderMessages(model, input);
    renderTable(model, input);
    renderChart(model);
  }

  function bindAutoRecalculate() {
    document.querySelectorAll("#calc-form input, #calc-form select").forEach((el) => {
      el.addEventListener("blur", render);
      el.addEventListener("change", render);
    });
  }

  function init() {
    fillDefaults();
    render();
    bindAutoRecalculate();
    document.getElementById("resetBtn").addEventListener("click", () => {
      fillDefaults();
      render();
    });
  }

  return { init };
})();