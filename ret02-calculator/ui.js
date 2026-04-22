// --- appended features ---

function renderSoftWarnings(input) {
  const warnings = [];

  if (input.preReturn > 0.08) warnings.push('Pre-retirement return above 8% is aggressive.');
  if (input.postReturn > 0.06) warnings.push('Post-retirement return above 6% is aggressive.');
  if (input.inflation > 0.05) warnings.push('Inflation above 5% is higher than typical.');
  if (input.desiredPct > 1) warnings.push('Desired income over 100% is unusually high.');

  const box = document.getElementById('softWarnings');
  if (!box) return;

  if (warnings.length) {
    box.innerHTML = warnings.map(w => `<div>⚠ ${w}</div>`).join('');
    box.style.display = 'block';
  } else {
    box.style.display = 'none';
  }
}

function getScenarioStore() {
  return JSON.parse(localStorage.getItem('ret02_scenarios') || '{}');
}

function saveScenario(name, input) {
  if (!name) return alert('Enter a scenario name');
  const store = getScenarioStore();
  store[name] = input;
  localStorage.setItem('ret02_scenarios', JSON.stringify(store));
  loadScenarioDropdown();
}

function loadScenario(name) {
  const store = getScenarioStore();
  const data = store[name];
  if (!data) return;

  Object.entries(data).forEach(([key, val]) => {
    const el = document.getElementById(key);
    if (!el) return;
    el.value = val;
  });
}

function deleteScenario(name) {
  const store = getScenarioStore();
  delete store[name];
  localStorage.setItem('ret02_scenarios', JSON.stringify(store));
  loadScenarioDropdown();
}

function loadScenarioDropdown() {
  const select = document.getElementById('scenarioSelect');
  if (!select) return;

  const store = getScenarioStore();
  select.innerHTML = '<option value="">Select a saved scenario</option>' +
    Object.keys(store).map(k => `<option value="${k}">${k}</option>`).join('');
}

// hook into existing init and render
const _origInit = window.ret02Ui.init;
window.ret02Ui.init = function() {
  _origInit();

  loadScenarioDropdown();

  document.getElementById('saveScenarioBtn').onclick = () => {
    saveScenario(document.getElementById('scenarioName').value, readInputs());
  };

  document.getElementById('loadScenarioBtn').onclick = () => {
    loadScenario(document.getElementById('scenarioSelect').value);
    window.ret02Ui.init();
  };

  document.getElementById('deleteScenarioBtn').onclick = () => {
    deleteScenario(document.getElementById('scenarioSelect').value);
  };
};

const _origRender = render;
render = function() {
  const input = readInputs();
  renderSoftWarnings(input);
  _origRender();
};