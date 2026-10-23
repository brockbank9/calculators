// v1.3 structured scenario validation (standalone, not activated in v1.2.1)
export const FIELD_TYPES = Object.freeze({
  includeSocialSecurity: 'YN',
  maritalStatus: 'MS'
});
const aliases = {
  includeSocialSecurity: ['includeSocialSecurity','include_social_security','socialSecurity'],
  maritalStatus: ['maritalStatus','marital_status','singleOrMarried']
};
export function normalizeChoice(field, value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (field === 'includeSocialSecurity') {
    if (['n','no','false','off','exclude','without','none'].includes(text)) return 'N';
    if (['y','yes','true','on','include','with'].includes(text)) return 'Y';
  }
  if (field === 'maritalStatus') {
    if (['s','single','unmarried','no spouse','without spouse','divorced','widowed'].includes(text)) return 'S';
    if (['m','married','with spouse'].includes(text)) return 'M';
  }
  return null;
}
export function validateScenarioCommand(payload, allowedNumericFields = {}) {
  if (!payload || payload.action !== 'compare' || !Array.isArray(payload.changes)) {
    return {ok:false,error:'Invalid scenario command'};
  }
  const changes = {};
  for (const change of payload.changes) {
    if (!change || typeof change.field !== 'string') return {ok:false,error:'Invalid field'};
    const field = Object.keys(aliases).find(key => aliases[key].includes(change.field)) || change.field;
    if (Object.hasOwn(FIELD_TYPES,field)) {
      const normalized = normalizeChoice(field,change.value);
      if (!normalized) return {ok:false,error:'Invalid selection for '+field};
      changes[field] = normalized;
    } else if (Object.hasOwn(allowedNumericFields,field)) {
      const n = Number(change.value);
      const {min,max} = allowedNumericFields[field];
      if (!Number.isFinite(n) || n < min || n > max) return {ok:false,error:'Out of range: '+field};
      changes[field] = n;
    } else return {ok:false,error:'Unrecognized field: '+field};
  }
  if (!Object.keys(changes).length) return {ok:false,error:'No changes requested'};
  return {ok:true,changes};
}
