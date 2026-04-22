const form = document.createElement('div');
form.innerHTML = `
<label>Current Age <input id='age' type='number' value='40'/></label><br/>
<label>Retirement Age <input id='retire' type='number' value='65'/></label><br/>
<label>Savings ($) <input id='savings' type='number' value='50000'/></label><br/>
<label>Annual Contribution ($) <input id='contrib' type='number' value='10000'/></label><br/>
<label>Return (%) <input id='rate' type='number' value='5'/></label><br/>
<button onclick='calc()'>Calculate</button>
<div id='output'></div>
`;
document.getElementById('app').appendChild(form);

function calc(){
  let age=+document.getElementById('age').value;
  let retire=+document.getElementById('retire').value;
  let savings=+document.getElementById('savings').value;
  let contrib=+document.getElementById('contrib').value;
  let rate=+document.getElementById('rate').value/100;

  let years=retire-age;
  let total=savings;
  let rows="";

  for(let i=1;i<=years;i++){
    total = total*(1+rate)+contrib;
    rows += `<tr><td>${age+i}</td><td>${total.toFixed(0)}</td></tr>`;
  }

  document.getElementById('output').innerHTML = `
    <h3>Projected Value: $${total.toFixed(0)}</h3>
    <table border='1'><tr><th>Age</th><th>Balance</th></tr>${rows}</table>
  `;
}
