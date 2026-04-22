window.ret02Model = (() => {
  function pia(aime) {
    if (aime < 711) return aime * 0.9;
    if (aime < 4288) return (aime - 711) * 0.32 + 711 * 0.9;
    return (aime - 4288) * 0.15 + (4288 - 711) * 0.32 + 711 * 0.9;
  }

  function maxFamilyBenefit(totalPia) {
    if (totalPia < 909) return totalPia * 1.5;
    if (totalPia < 1312) return (totalPia - 909) * 2.72 + 909 * 1.5;
    if (totalPia < 1711) return (totalPia - 1312) * 1.34 + (1312 - 909) * 2.72 + 909 * 1.5;
    return (totalPia - 1711) * 1.75 + (1711 - 1312) * 1.34 + (1312 - 909) * 2.72 + 909 * 1.5;
  }

  function compute(input) {
    const includeSS = input.includeSS.toLowerCase() === "y";
    const marital = input.marital.toLowerCase();
    const currentCombinedIncome = input.currentIncome + input.spouseIncome;
    const salaryIncrease = input.inflation === input.preReturn ? input.inflation + 0.0000001 : input.inflation;

    const aimeClient = includeSS ? Math.min(input.currentIncome / 12, 102000 / 12) : 0;
    const aimeSpouse = includeSS ? Math.min(input.spouseIncome / 12, 102000 / 12) : 0;
    const piaClient = pia(aimeClient);
    const piaSpouse = pia(aimeSpouse);
    const mfb = maxFamilyBenefit(piaClient + piaSpouse);

    const currentYear = new Date().getFullYear();
    const fullBenefitsAge = (currentYear - input.currentAge) <= 1938 ? 65 : (currentYear - input.currentAge) <= 1954 ? 66 : 67;
    const yearsDifference = Math.min(Math.max(input.retireAge, 62), 70) - fullBenefitsAge;
    const ssAdjustment = yearsDifference > 0
      ? 0.08 * yearsDifference
      : Math.abs(yearsDifference) > 3
        ? -(1 / 180 * 36) + (yearsDifference + 3) * 12 * (1 / 240)
        : yearsDifference * 0.06666;

    const ssMonthly = Math.min(
      marital === "m" ? Math.max(piaClient * 1.5, piaClient + piaSpouse) : piaClient,
      mfb
    ) * (1 + ssAdjustment);
    const ssAnnualBase = ssMonthly * 12;

    const yearsUntilRetirement = input.retireAge - input.currentAge;
    const yearsOfRetirement = input.retireYears;
    const totalAnalysisYears = yearsUntilRetirement + yearsOfRetirement;

    let pvSum = 0;
    let ageForPv = input.currentAge;
    for (let year = 1; year <= 75; year += 1) {
      if (year > totalAnalysisYears) break;
      const goal = year <= yearsUntilRetirement ? 0 : ((currentCombinedIncome * (1 + salaryIncrease) ** yearsUntilRetirement) * (1 + input.inflation) ** (year - yearsUntilRetirement - 1)) * input.desiredPct;
      const lessSoc = includeSS
        ? (input.retireAge >= 62
            ? (ageForPv < input.retireAge ? 0 : ssAnnualBase * (1 + salaryIncrease) ** (year - 1))
            : (ageForPv < 62 ? 0 : ssAnnualBase * (1 + salaryIncrease) ** (year - 1)))
        : 0;
      const shortfall = goal - lessSoc;
      const pv = year <= yearsUntilRetirement
        ? shortfall / (1 + input.preReturn) ** (ageForPv - input.retireAge + 1)
        : shortfall / (1 + input.postReturn) ** (ageForPv - input.retireAge + 1);
      pvSum += pv;
      ageForPv += 1;
    }

    const amountNeededAtRetirement = pvSum - (input.currentSavings * (1 + input.preReturn) ** yearsUntilRetirement);
    const annuityFactor = yearsUntilRetirement === 0
      ? 0
      : (((1 + input.preReturn) ** yearsUntilRetirement) - ((1 + salaryIncrease) ** yearsUntilRetirement)) / (input.preReturn - salaryIncrease);
    const currentAnnualSave = yearsUntilRetirement === 0 ? 0 : amountNeededAtRetirement / annuityFactor;
    const currentSavePct = currentCombinedIncome === 0 ? 0 : currentAnnualSave / currentCombinedIncome;

    const waitAnnuityFactor = yearsUntilRetirement < 2
      ? 0
      : (((1 + input.preReturn) ** (yearsUntilRetirement - 1)) - ((1 + salaryIncrease) ** (yearsUntilRetirement - 1))) / (input.preReturn - salaryIncrease);
    const waitAnnualSave = yearsUntilRetirement < 2 ? 0 : amountNeededAtRetirement / waitAnnuityFactor;
    const waitSavePct = yearsUntilRetirement < 2 || currentSavePct < 0 || amountNeededAtRetirement === 0 || currentCombinedIncome === 0
      ? 0
      : waitAnnualSave / currentCombinedIncome;

    const rows = [];
    let age = input.currentAge;
    let salary = currentCombinedIncome;
    let beginningBalance = input.currentSavings;

    for (let year = 1; year <= 75; year += 1) {
      if (year > totalAnalysisYears) break;
      const interest = beginningBalance * (year <= yearsUntilRetirement ? input.preReturn : input.postReturn);
      const savings = currentSavePct < 0 ? 0 : (year <= yearsUntilRetirement ? salary * currentSavePct : 0);
      const desiredIncome = year <= yearsUntilRetirement ? 0 : ((currentCombinedIncome * (1 + salaryIncrease) ** yearsUntilRetirement) * (1 + input.inflation) ** (year - yearsUntilRetirement - 1)) * input.desiredPct;
      const ssIncome = includeSS
        ? (input.retireAge >= 62
            ? (age < input.retireAge ? 0 : ssAnnualBase * (1 + salaryIncrease) ** (year - 1))
            : (age < 62 ? 0 : ssAnnualBase * (1 + salaryIncrease) ** (year - 1)))
        : 0;
      const withdrawals = Math.min(beginningBalance + interest, desiredIncome - ssIncome);
      const endingBalance = beginningBalance + interest + savings - withdrawals;
      const shortfall = desiredIncome - ssIncome;
      const pv = year <= yearsUntilRetirement
        ? shortfall / (1 + input.preReturn) ** (age - input.retireAge + 1)
        : shortfall / (1 + input.postReturn) ** (age - input.retireAge + 1);

      rows.push({ year, age, salary, beginningBalance, interest, savings, desiredIncome, ssIncome, withdrawals, endingBalance, goal: desiredIncome, lessSoc: ssIncome, shortfall, pv });

      age += 1;
      salary = (yearsUntilRetirement + 1) > (year + 1) ? salary * (1 + salaryIncrease) : 0;
      beginningBalance = endingBalance;
    }

    const finalLookupAge = input.retireAge + input.retireYears - 1;
    const finalRow = rows.find((row) => row.age === finalLookupAge) || rows[rows.length - 1];

    return {
      currentYear, currentCombinedIncome, salaryIncrease, aimeClient, aimeSpouse, piaClient, piaSpouse,
      maxFamilyBenefit: mfb, fullBenefitsAge, yearsDifference, ssAdjustment, ssMonthly, ssAnnualBase,
      yearsUntilRetirement, yearsOfRetirement, totalAnalysisYears, amountNeededAtRetirement,
      currentAnnualSave, currentSavePct, waitAnnualSave, waitSavePct, finalRow, rows
    };
  }

  return { compute };
})();