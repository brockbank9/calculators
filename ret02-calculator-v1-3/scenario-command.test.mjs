import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {normalizeChoice,validateScenarioCommand} from './scenario-command.js';
for (const [input,expected] of [['N','N'],['no','N'],['without','N'],['Y','Y'],['yes','Y']]) assert.equal(normalizeChoice('includeSocialSecurity',input),expected);
for (const [input,expected] of [['S','S'],['single','S'],['M','M'],['married','M']]) assert.equal(normalizeChoice('maritalStatus',input),expected);
assert.deepEqual(validateScenarioCommand({action:'compare',changes:[{field:'includeSocialSecurity',value:'N'},{field:'maritalStatus',value:'single'}]}),{ok:true,changes:{includeSocialSecurity:'N',maritalStatus:'S'}});
assert.equal(validateScenarioCommand({action:'compare',changes:[{field:'unrecognized',value:5}]}).ok,false);
console.log('Scenario command tests passed');

const browser = {window:{location:{search:'?aipro=on'}},document:{addEventListener(){}},URLSearchParams,Intl};
vm.runInNewContext(readFileSync(new URL('./scenario-planner.js',import.meta.url),'utf8'),browser);
const noSS = browser.window.RET13_PARSE_FALLBACK('Compare a scenario with no Social Security and marital status single.');
assert.equal(noSS.changes.includeSS,'N','Explicit no Social Security must be parsed');
assert.equal(noSS.changes.marital,'S','Single must be selected');
const transition = browser.window.RET13_PARSE_FALLBACK('Compare from married to single with no Social Security');
assert.equal(transition.changes.marital,'S','Transition to single must not revert to married');
assert.equal(transition.changes.includeSS,'N');
console.log('Scenario request regression tests passed');

const numeric = browser.window.RET13_PARSE_FALLBACK('Compare a scenario where my retirement age is 67, inflation is 4%, and my pre-retirement investment return is 7%.');
assert.equal(numeric.changes.retireAge,67);
assert.equal(numeric.changes.inflation,0.04);
assert.equal(numeric.changes.preReturn,0.07,'Pre-retirement investment return must be recognized');
const post = browser.window.RET13_PARSE_FALLBACK('Compare post-retirement investment return at 5%');
assert.equal(post.changes.postReturn,0.05);
console.log('Multi-field numeric scenario tests passed');
