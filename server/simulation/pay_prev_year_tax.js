import { ensureConnection, connection } from "../server.js";
// NEED TO USE:
// - expense withdrawal strategy: ordering on set of investments to use if cash account doesn't have enough
// - state and federal tax
// - non-discretionary expenses (events)

// - Get income + marriage status; Pull year-1 tax bracket.
// - If cash is not enough, find the difference and sell based on expense withdrawal strategy.

/**
 * TODO:
 * - Selling expenses
 * - Capital Gain Tax
 * - Early Withdrawal Tax
 */

/**
 * @param totals cashinvestment, income, social security, gains, earlywithdrawals
 * @param scenarioID ID of given scenario
 * @param incomeEvents income events for the given scenario
 * @param runningTotals
 * @param taxData includes brackets and deduction for current year + filing status
 */
export async function payTaxes(totals, scenarioID, incomeEvents, runningTotals, taxData) {
    await ensureConnection();

    // Find the amount owed by taxing all sources of income federally and by state
    const fedOwe = Number(await computeFederal(totals.curYearIncome, totals.curYearSS, taxData));
    const stOwe = Number(await computeState(totals.curYearIncome, taxData));
    const cptOwe = Number(await computeCapital(totals.curYearGains, taxData));
    const amtOwed = Number(+fedOwe + +stOwe + +cptOwe);
    console.log("federal", fedOwe, "state", stOwe, "deduction", taxData.deduction[0].standard_deduction);
    console.log("amtOwed", amtOwed);
    return amtOwed;
}

/**
 * Computes how much federal income tax a scenario would ower for the previous year
 * @param income yearly income
 * @param ssIncome social security income
 * @param taxData tax brackets
 * @return amount of taxes owed
 */
const computeFederal = async (income, ssIncome, taxData) => {
    // Calculate deduction
    const dIncome = income - taxData.deduction[0].standard_deduction;
    // Prepare query for bracket calculations
    const fedTaxBrackets = taxData.federal;
    let sum = 0;
    for (const bracket of fedTaxBrackets) {
        console.log("bracket rate", bracket.tax_rate)
        if (dIncome > +bracket.income_max) { // Checks if we are in a bracket that is completely full
            sum += (+bracket.income_max * bracket.tax_rate);
        }
        else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
            console.log("bracket rate", bracket.tax_rate);
            sum += ((dIncome - +bracket.income_min) * bracket.tax_rate);
            break;
        }
    }

    // Social Security Calculation
    const ssIncomeReduced = ssIncome * .85;
    for (const bracket of fedTaxBrackets) {
        if (ssIncomeReduced > +bracket.income_max) { // Checks if we are in a bracket that is completely full
            sum += (+bracket.income_max * bracket.tax_rate);
        }
        else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
            sum += ((ssIncomeReduced - +bracket.income_min) * bracket.tax_rate);
            break;
        }
    }
    return sum;
}

/**
 * Computes how much state income tax a scenario would owe for the previous year (Excludes social security)
 * @param income yearly income (does not include social security)
 * @param taxData tax brackets
 * @return amount of taxes owed
 */
const computeState = async (income, taxData) => {
    const stateTaxBrackets = taxData.state;

    let sum = 0;
    // Each event will be taxed individually and added to an overall sum
    for (const bracket of stateTaxBrackets) {
        if (income > +bracket.income_max) { // Checks if we are in a bracket that is completely full
            sum += ((+bracket.income_max * +bracket.tax_rate) + +bracket.base);
        }
        else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
            sum += (((income - +bracket.income_min) * bracket.tax_rate) + +bracket.base);
            break;
        }
    }
    return sum;
}

/**
 * Computes capital gains tax
 * @param gains capital gains
 * @param taxData tax brackets
 * @return amount of capital gains tax owed
 */
const computeCapital = async (gains, taxData) => {
    const cptBrackets = taxData.capital;
    let sum = 0;
    for (const bracket of cptBrackets) {
        if (gains > +bracket.income_max) { // Checks if we are in a bracket that is completely full
            sum += (+bracket.income_max * bracket.cap_gains_tax_rate);
        }
        else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
            console.log("bracket rate", bracket.cap_gains_tax_rate);
            sum += ((gains - +bracket.income_min) * bracket.cap_gains_tax_rate);
            return sum;
        }
    }
}