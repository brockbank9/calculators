(() => {
  const allowed = {
    currentAge:[18,90],currentIncome:[0,1e12],spouseIncome:[0,1e12],
    currentSavings:[0,1e12],inflation:[0,.15],retireAge:[19,100],
    retireYears:[1,50],desiredPct:[0,1.5],preReturn:[0,.2],postReturn:[0,.2]
  };
  const aliases = {includeSocialSecurity:'includeSS',maritalStatus:'marital',
    include_social_security:'includeSS',marital_status:'marital'};
  window.RET13_VALIDATE_SCENARIO = (data,baseline) => {
    if (!data || data.action !== 'compare' || !Array.isArray(data.changes)) return {ok:false};
    const changes = {};
    for (const item of data.changes) {
      if (!item || typeof item.field !== 'string') return {ok:false};
      const field = aliases[item.field] || item.field;
      if (field === 'includeSS') {
        if (!['Y','N'].includes(item.value)) return {ok:false};
        changes[field] = item.value;
      } else if (field === 'marital') {
        if (!['M','S'].includes(item.value)) return {ok:false};
        changes[field] = item.value;
      } else if (Object.hasOwn(allowed,field)) {
        if (typeof item.value !== 'number' || !Number.isFinite(item.value)) return {ok:false};
        const [min,max] = allowed[field];
        if (item.value < min || item.value > max) return {ok:false};
        changes[field] = item.value;
      } else return {ok:false};
    }
    if (!Object.keys(changes).length) return {ok:false};
    const merged = {...baseline,...changes};
    if (merged.retireAge <= merged.currentAge) return {ok:false};
    return {ok:true,changes};
  };
})();
