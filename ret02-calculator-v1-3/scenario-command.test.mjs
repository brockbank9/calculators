import assert from 'node:assert/strict';
import {normalizeChoice,validateScenarioCommand} from './scenario-command.js';
for (const [input,expected] of [['N','N'],['no','N'],['without','N'],['Y','Y'],['yes','Y']]) assert.equal(normalizeChoice('includeSocialSecurity',input),expected);
for (const [input,expected] of [['S','S'],['single','S'],['M','M'],['married','M']]) assert.equal(normalizeChoice('maritalStatus',input),expected);
assert.deepEqual(validateScenarioCommand({action:'compare',changes:[{field:'includeSocialSecurity',value:'N'},{field:'maritalStatus',value:'single'}]}),{ok:true,changes:{includeSocialSecurity:'N',maritalStatus:'S'}});
assert.equal(validateScenarioCommand({action:'compare',changes:[{field:'unrecognized',value:5}]}).ok,false);
console.log('Scenario command tests passed');
