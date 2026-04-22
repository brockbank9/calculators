window.ret02Ui = (() => {
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
  const number1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
  const percent1 = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function fillDefaults() {
    Object.entries(defaults).forEach(([key, value]) => { document.getElementById(key).value = value; });
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

  function fmt(value, kind = "currency") {
    if (kind === "int") return Number(value).toLocaleString("en-US");
    if (kind === "percent1") return percent1.format(value);
    if (kind === "number1") return number1.format(value);
    return currency.format(value);
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

  function renderTable(model) {
    document.querySelector("#projectionTable thead").innerHTML = `
      <tr>
        <th>Year</th>
        <th>Age</th>
        <th>Salary</th>
        <th>Beg Balance</th>
        <th>Interest</th>
        <th>Savings</th>
        <th>Desired Inc</th>
        <th>SS Inc</th>
        <th>Withdrawals</th>
        <th>End Balance</th>
      </tr>`;

    document.querySelector("#projectionTable tbody").innerHTML = model.rows.map((row) => `
      <tr>
        <td>${row.year}</td>
        <td>${row.age}</td>
        <td>${fmt(row.salary)}</td>
        <td>${fmt(row.beginningBalance)}</td>
        <td>${fmt(row.interest)}</td>
        <td>${fmt(row.savings)}</td>
        <td>${fmt(row.desiredIncome)}</td>
        <td>${fmt(row.ssIncome)}</td>
        <td>${fmt(row.withdrawals)}</td>
        <td>${fmt(row.endingBalance)}</td>
      </tr>`).join("");
  }

  function renderChart(model) {
    const canvas = document.getElementById("projectionChart");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 1000;
    const height = 440;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.font = "16px Arial";
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.fillText("Retirement Analysis", width / 2, 22);

    const pad = { top: 60, right: 24, bottom: 78, left: 96 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const series = [
      { values: model.rows.map(r => r.endingBalance), color: "#111827", label: "End Balance" },
      { values: model.rows.map(r => r.desiredIncome), color: "#4f46e5", label: "Desired Income" },
      { values: model.rows.map(r => r.ssIncome), color: "#059669", label: "Social Security Income" }
    ];

    const maxVal = Math.max(...series.flatMap(s => s.values), 1);
    const yTicks = 5;

    // grid + y-axis labels
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    for (let i = 0; i <= yTicks; i += 1) {
      const ratio = i / yTicks;
      const y = pad.top + plotH - plotH * ratio;
      const tickValue = maxVal * ratio;

      ctx.strokeStyle = "#e5e7eb";
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = "#4b5563";
      ctx.fillText(currency.format(tickValue), pad.left - 10, y + 4);
    }

    // axes
    ctx.strokeStyle = "#9ca3af";
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.lineTo(width - pad.right, pad.top + plotH);
    ctx.stroke();

    // lines
    series.forEach((s) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.values.forEach((v, i) => {
        const x = pad.left + (plotW * i) / Math.max(model.rows.length - 1, 1);
        const y = pad.top + plotH - (v / maxVal) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // x-axis ticks from client age column
    const desiredTicks = Math.min(12, model.rows.length);
    const step = Math.max(1, Math.ceil(model.rows.length / desiredTicks));
    ctx.textAlign = "center";
    ctx.fillStyle = "#4b5563";
    ctx.font = "11px Arial";
    for (let i = 0; i < model.rows.length; i += step) {
      const row = model.rows[i];
      const x = pad.left + (plotW * i) / Math.max(model.rows.length - 1, 1);
      const axisY = pad.top + plotH;

      ctx.strokeStyle = "#9ca3af";
      ctx.beginPath();
      ctx.moveTo(x, axisY);
      ctx.lineTo(x, axisY + 6);
      ctx.stroke();

      ctx.fillText(String(row.age), x, axisY + 20);
    }

    // ensure last age label is shown
    if (model.rows.length > 1) {
      const lastIndex = model.rows.length - 1;
      const lastRow = model.rows[lastIndex];
      const x = pad.left + plotW;
      const axisY = pad.top + plotH;
      ctx.strokeStyle = "#9ca3af";
      ctx.beginPath();
      ctx.moveTo(x, axisY);
      ctx.lineTo(x, axisY + 6);
      ctx.stroke();
      ctx.fillText(String(lastRow.age), x, axisY + 20);
    }

    // x-axis label
    ctx.font = "12px Arial";
    ctx.fillStyle = "#111";
    ctx.fillText("Age", pad.left + plotW / 2, height - 16);

    // y-axis label
    ctx.save();
    ctx.translate(22, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = "#111";
    ctx.font = "12px Arial";
    ctx.fillText("Dollar Value", 0, 0);
    ctx.restore();

    // legend
    ctx.textAlign = "left";
    ctx.font = "12px Arial";
    const legendY = 38;
    const legendSpacing = 180;
    const legendStartX = pad.left;
    series.forEach((s, i) => {
      const x = legendStartX + i * legendSpacing;
      ctx.fillStyle = s.color;
      ctx.fillRect(x, legendY - 10, 12, 12);
      ctx.fillStyle = "#333";
      ctx.fillText(s.label, x + 18, legendY);
    });
  }

  function render() {
    const input = readInputs();
    const model = window.ret02Model.compute(input);
    renderMessages(model, input);
    renderTable(model);
    renderChart(model);
  }

  function bindAutoRecalculate() {
    const fields = document.querySelectorAll("#calc-form input, #calc-form select");
    fields.forEach((field) => {
      field.addEventListener("blur", render);
      field.addEventListener("change", render);
    });
  }

  function init() {
    fillDefaults();
    render();
    bindAutoRecalculate();
    document.getElementById("calc-form").addEventListener("submit", (event) => { event.preventDefault(); render(); });
    document.getElementById("resetBtn").addEventListener("click", () => { fillDefaults(); render(); });
    window.addEventListener("resize", render);
  }

  return { init };
})();