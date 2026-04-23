window.ret02Ui = (() => {
  let chartInstance;
  const percentFields = ['inflation', 'desiredPct', 'preReturn', 'postReturn'];
  const currencyFields = ['currentIncome', 'spouseIncome', 'currentSavings'];
  const scenarioStorageKey = 'ret02_scenarios';

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
    includeSS: 'Y',
    marital: 'M'
  };

  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const percent1 = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function formatPercentDisplay(value) {
    if (!Number.isFinite(value)) return '0%';
    return (value * 100).toFixed(1).replace(/\.0$/, '') + '%';
  }

  function parsePercentInput(value) {
    const cleaned = String(value ?? '').replace('%', '').trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? num / 100 : 0;
  }

  function formatCurrencyInput(value) {
    if (!Number.isFinite(Number(value))) return '$0';
    return currency.format(Number(value));
  }

  function parseCurrencyInput(value) {
    const cleaned = String(value ?? '').replace(/[$,\s]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  function ensureInlineError(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return null;
    const label = input.closest('label');
    if (!label) return null;
    let msg = label.querySelector('.field-error');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'field-error';
      label.appendChild(msg);
    }
    return msg;
  }

  function applyInputValues(values) {
    Object.entries(values).forEach(([key, value]) => {
      const el = document.getElementById(key);
      if (!el) return;
      if (percentFields.includes(key)) {
        el.value = formatPercentDisplay(Number(value));
      } else if (currencyFields.includes(key)) {
        el.value = formatCurrencyInput(Number(value));
      } else {
        el.value = value;
      }
    });
  }

  function fillDefaults() {
    Object.entries(defaults).forEach(([key, value]) => {
      const el = document.getElementById(key);
      if (!el) return;
      if (percentFields.includes(key)) {
        el.value = formatPercentDisplay(value);
      } else if (currencyFields.includes(key)) {
        el.value = formatCurrencyInput(value);
      } else {
        el.value = value;
      }
    });
    clearValidationState();
  }

  function readInputs() {
    return {
      currentAge: Number(document.getElementById('currentAge').value),
      spouseIncome: parseCurrencyInput(document.getElementById('spouseIncome').value),
      currentIncome: parseCurrencyInput(document.getElementById('currentIncome').value),
      currentSavings: parseCurrencyInput(document.getElementById('currentSavings').value),
      inflation: parsePercentInput(document.getElementById('inflation').value),
      retireAge: Number(document.getElementById('retireAge').value),
      retireYears: Number(document.getElementById('retireYears').value),
      desiredPct: parsePercentInput(document.getElementById('desiredPct').value),
      preReturn: parsePercentInput(document.getElementById('preReturn').value),
      postReturn: parsePercentInput(document.getElementById('postReturn').value),
      includeSS: document.getElementById('includeSS').value.trim().toUpperCase(),
      marital: document.getElementById('marital').value.trim().toUpperCase()
    };
  }

  function clearValidationState() {
    document.querySelectorAll('#calc-form .input-error').forEach((el) => el.classList.remove('input-error'));
    document.querySelectorAll('#calc-form .field-error').forEach((el) => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  function setFieldError(fieldId, message) {
    const el = document.getElementById(fieldId);
    if (el) el.classList.add('input-error');
    const msg = ensureInlineError(fieldId);
    if (msg) {
      msg.textContent = message;
      msg.style.display = 'block';
    }
  }

  function validateInputs(input) {
    const errors = [];
    const pushError = (fieldId, message) => {
      errors.push(message);
      setFieldError(fieldId, message);
    };

    if (!Number.isFinite(input.currentAge) || input.currentAge < 18 || input.currentAge > 90) {
      pushError('currentAge', 'Enter an age from 18 to 90.');
    }
    if (!Number.isFinite(input.retireAge) || input.retireAge <= input.currentAge || input.retireAge > 100) {
      pushError('retireAge', 'Must be greater than current age and no more than 100.');
    }
    if (!Number.isFinite(input.retireYears) || input.retireYears < 1 || input.retireYears > 50) {
      pushError('retireYears', 'Enter a value from 1 to 50 years.');
    }
    if (input.currentIncome < 0) pushError('currentIncome', 'Cannot be negative.');
    if (input.spouseIncome < 0) pushError('spouseIncome', 'Cannot be negative.');
    if (input.currentSavings < 0) pushError('currentSavings', 'Cannot be negative.');

    if (input.inflation < 0 || input.inflation > 0.15) {
      pushError('inflation', 'Enter a value from 0% to 15%.');
    }
    if (input.desiredPct < 0 || input.desiredPct > 1.5) {
      pushError('desiredPct', 'Enter a value from 0% to 150%.');
    }
    if (input.preReturn < 0 || input.preReturn > 0.2) {
      pushError('preReturn', 'Enter a value from 0% to 20%.');
    }
    if (input.postReturn < 0 || input.postReturn > 0.2) {
      pushError('postReturn', 'Enter a value from 0% to 20%.');
    }

    return errors.length === 0;
  }

  function fmtCurrency(value, showSymbol = false) {
    const rounded = Math.round(value);
    const formatted = Math.abs(rounded).toLocaleString('en-US');
    const prefix = rounded < 0 ? '-' : '';
    const dollar = showSymbol ? '$' : '';
    return `${prefix}${dollar}${formatted}`;
  }

  function renderMessages(model, input) {
    const ageMessage = Math.round(input.currentAge + model.yearsUntilRetirement + model.yearsOfRetirement);
    const ResultsParagraph1 = model.currentSavePct < 0
      ? `Congratulations!!! It appears that you have saved enough to meet your goal. In fact, it appears that at age ${ageMessage} you will still have ${currency.format(model.finalRow.endingBalance)} in your retirement accounts.`
      : `To provide the inflation-adjusted retirement income you desire, you will need to save ${percent1.format(model.currentSavePct)} of your yearly income (less any employer match, if applicable). This year, for example, the amount would be ${currency.format(model.currentAnnualSave)} or ${currency.format(model.currentAnnualSave / 12)} a month.`;
    const ResultsParagraph2 = model.yearsUntilRetirement < 2 || model.currentSavePct < 0 || model.waitSavePct === 0
      ? ''
      : `If you wait just one year to start saving for retirement you will need to save ${percent1.format(model.waitSavePct)} of your annual income, which amounts to ${currency.format(model.waitAnnualSave)} in the first year. Save Now and Save Less!!!`;

    document.getElementById('primaryMessage').textContent = ResultsParagraph1;
    document.getElementById('waitMessage').textContent = ResultsParagraph2;
    document.getElementById('metrics').innerHTML = '';
  }

  function clearOutputs() {
    document.getElementById('primaryMessage').textContent = '';
    document.getElementById('waitMessage').textContent = '';
    document.getElementById('metrics').innerHTML = '';
    document.querySelector('#projectionTable thead').innerHTML = '';
    document.querySelector('#projectionTable tbody').innerHTML = '';
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  function moneyCell(value, showSymbol, extraClass = '') {
    const negative = value < 0 ? ' negative' : '';
    return `<td class="money${negative}${extraClass ? ` ${extraClass}` : ''}">${fmtCurrency(value, showSymbol)}</td>`;
  }

  function withdrawalCell(value, showSymbol) {
    const colorClass = value > 0 ? ' positive-withdrawal' : value < 0 ? ' negative-withdrawal' : '';
    return moneyCell(value, showSymbol, colorClass);
  }

  function renderTable(model, input) {
    document.querySelector('#projectionTable thead').innerHTML = `
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

    document.querySelector('#projectionTable tbody').innerHTML = model.rows.map((row, index) => {
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
    }).join('');
  }

  function renderChart(model) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    const labels = model.rows.map((r) => r.age);
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { type: 'bar', label: 'Desired Income', data: model.rows.map((r) => r.desiredIncome), backgroundColor: 'rgba(79, 70, 229, 0.5)', borderColor: '#4f46e5', borderWidth: 1, grouped: false, order: 3, categoryPercentage: 0.9, barPercentage: 0.9 },
          { type: 'bar', label: 'Social Security Income', data: model.rows.map((r) => r.ssIncome), backgroundColor: '#059669', borderColor: '#059669', borderWidth: 0, grouped: false, order: 2, categoryPercentage: 0.9, barPercentage: 0.9 },
          { type: 'line', label: 'Ending Balance', data: model.rows.map((r) => r.endingBalance), borderColor: '#111827', backgroundColor: '#111827', borderWidth: 2, tension: 0.3, pointRadius: 0, pointHoverRadius: 4, fill: false, order: 1 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Retirement Analysis' },
          tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${currency.format(context.raw)}` } }
        },
        scales: {
          x: { stacked: false, title: { display: true, text: 'Age' }, ticks: { autoSkip: true, maxTicksLimit: 12 }, grid: { display: false } },
          y: { stacked: false, beginAtZero: true, ticks: { callback: (value) => currency.format(value) } }
        }
      }
    });
  }

  function addWrappedText(doc, text, x, y, maxWidth, lineHeight = 6) {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * lineHeight);
  }

  function buildInputRows(input) {
    return [
      ['Current age', String(input.currentAge)], ['Spouse annual income', currency.format(input.spouseIncome)], ['Current gross annual income', currency.format(input.currentIncome)], ['Current retirement savings', currency.format(input.currentSavings)], ['Inflation / salary increase', percent1.format(input.inflation)], ['Desired retirement age', String(input.retireAge)], ['Years of retirement income', String(input.retireYears)], ['Income desired at retirement', percent1.format(input.desiredPct)], ['Pre-retirement return', percent1.format(input.preReturn)], ['Post-retirement return', percent1.format(input.postReturn)], ['Include Social Security', input.includeSS], ['Single or married', input.marital]
    ];
  }

  function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter');
    const input = readInputs();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 16;

    doc.setFontSize(16);
    doc.text('Retirement Analysis Report', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 8;
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text('Results', margin, y);
    y += 6;

    const results1 = document.getElementById('primaryMessage').textContent || '';
    const results2 = document.getElementById('waitMessage').textContent || '';
    y = addWrappedText(doc, results1, margin, y, pageWidth - margin * 2, 5);
    y += 2;
    if (results2.trim()) {
      y = addWrappedText(doc, results2, margin, y, pageWidth - margin * 2, 5);
      y += 2;
    }

    const inputRows = buildInputRows(input);
    doc.setFontSize(12);
    doc.text('Inputs', margin, y + 4);
    doc.autoTable({
      startY: y + 6,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1.6, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 }, 1: { cellWidth: 38 }, 2: { fontStyle: 'bold', cellWidth: 42 }, 3: { cellWidth: 38 } },
      body: inputRows.slice(0, 6).map((row, idx) => [row[0], row[1], inputRows[idx + 6][0], inputRows[idx + 6][1]]),
      margin: { left: margin, right: margin }
    });

    y = doc.lastAutoTable.finalY + 6;
    const canvas = document.getElementById('projectionChart');
    const chartImage = canvas.toDataURL('image/png', 1.0);
    const chartWidth = pageWidth - margin * 2;
    const chartHeight = 70;
    if (y + chartHeight + 10 > pageHeight - margin) { doc.addPage(); y = margin; }
    doc.setFontSize(12);
    doc.text('Chart', margin, y);
    y += 4;
    doc.addImage(chartImage, 'PNG', margin, y, chartWidth, chartHeight);

    doc.addPage();
    doc.setFontSize(12);
    doc.text('Projection Table', margin, margin);
    doc.autoTable({
      html: '#projectionTable',
      startY: margin + 4,
      styles: { fontSize: 7, cellPadding: 1.5, halign: 'right' },
      headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.2, halign: 'center' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: margin, right: margin },
      theme: 'grid',
      columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' } }
    });
    doc.save('retirement-analysis-report.pdf');
  }

  function getScenarioStore() {
    try {
      return JSON.parse(localStorage.getItem(scenarioStorageKey) || '{}');
    } catch {
      return {};
    }
  }

  function loadScenarioDropdown() {
    const select = document.getElementById('scenarioSelect');
    if (!select) return;
    const store = getScenarioStore();
    select.innerHTML = '<option value="">Select a saved scenario</option>' + Object.keys(store).map((name) => `<option value="${name}">${name}</option>`).join('');
  }

  function saveScenario(name, input) {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      alert('Enter a scenario name.');
      return;
    }
    const store = getScenarioStore();
    store[trimmed] = input;
    localStorage.setItem(scenarioStorageKey, JSON.stringify(store));
    loadScenarioDropdown();
    const select = document.getElementById('scenarioSelect');
    if (select) select.value = trimmed;
  }

  function loadScenario(name) {
    const store = getScenarioStore();
    if (!store[name]) return;
    applyInputValues(store[name]);
    clearValidationState();
    render();
  }

  function deleteScenario(name) {
    const store = getScenarioStore();
    delete store[name];
    localStorage.setItem(scenarioStorageKey, JSON.stringify(store));
    loadScenarioDropdown();
    const select = document.getElementById('scenarioSelect');
    if (select) select.value = '';
  }

  function bindPercentFormatting() {
    percentFields.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      ensureInlineError(id);
      el.addEventListener('focus', () => { el.value = el.value.replace('%', ''); });
      el.addEventListener('blur', () => { const val = parsePercentInput(el.value || 0); el.value = formatPercentDisplay(val); });
    });
  }

  function bindCurrencyFormatting() {
    currencyFields.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      ensureInlineError(id);
      el.addEventListener('focus', () => { el.value = String(parseCurrencyInput(el.value)); });
      el.addEventListener('blur', () => { el.value = formatCurrencyInput(parseCurrencyInput(el.value)); });
    });
  }

  function bindInlineValidationTargets() {
    ['currentAge', 'retireAge', 'retireYears', 'includeSS', 'marital', ...percentFields, ...currencyFields].forEach((id) => ensureInlineError(id));
  }

  function bindAutoRenderInputs() {
    document.querySelectorAll('#calc-form .input-list input, #calc-form .input-list select').forEach((el) => {
      el.addEventListener('blur', render);
      el.addEventListener('change', render);
    });
  }

  function render() {
    clearValidationState();
    const input = readInputs();
    if (!validateInputs(input)) {
      clearOutputs();
      return;
    }
    const model = window.ret02Model.compute(input);
    renderMessages(model, input);
    renderTable(model, input);
    renderChart(model);
  }

  function init() {
    fillDefaults();
    bindInlineValidationTargets();
    bindPercentFormatting();
    bindCurrencyFormatting();
    bindAutoRenderInputs();
    loadScenarioDropdown();
    render();

    document.getElementById('calc-form').addEventListener('submit', (e) => {
      e.preventDefault();
      render();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      fillDefaults();
      render();
    });

    const saveBtn = document.getElementById('saveScenarioBtn');
    const loadBtn = document.getElementById('loadScenarioBtn');
    const deleteBtn = document.getElementById('deleteScenarioBtn');

    if (saveBtn) saveBtn.addEventListener('click', () => saveScenario(document.getElementById('scenarioName').value, readInputs()));
    if (loadBtn) loadBtn.addEventListener('click', () => loadScenario(document.getElementById('scenarioSelect').value));
    if (deleteBtn) deleteBtn.addEventListener('click', () => {
      const selected = document.getElementById('scenarioSelect').value;
      if (!selected) return;
      deleteScenario(selected);
    });

    const exportBtn = document.getElementById('exportPdfBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportPDF);
  }

  return { init };
})();