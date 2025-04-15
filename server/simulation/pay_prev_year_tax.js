import { ensureConnection, connection } from "../server.js";
// NEED TO USE:
// - expense withdrawal strategy: ordering on set of investments to use if cash account doesn't have enough
// - state and federal tax
// - non-discretionary expenses (events)

// - Get income + marriage status; Pull year-1 tax bracket.
// - If cash is not enough, find the difference and sell based on expense withdrawal strategy.

/**
 * TODO:
 * - Implement year checking so we can actually make it prev year
 * - Deductions
 * - Selling expenses
 * - Capital Gain Tax
 * - Early Withdrawal Tax
 */

/**
 * @param scenarioID ID of given scenario
 * @param incomeEvents income events for the given scenario
 * @param year Simulation year minus one (to calculate prev year taxes)
 */
export async function payTaxes(scenarioID, incomeEvents, year) {
    await ensureConnection();
    const scenario = await getScenario(scenarioID);
    // const incomeEvents = await getIncomeEvents(scenarioID); // List of income events

    // Find the amount owed by taxing all sources of income federally and by state
    const amtOwed = (await computeFederal(incomeEvents, scenario.marital_status, year) + await computeState(incomeEvents, scenario.marital_status, scenario.residence_state, year)) - await getDeduction(scenario.marital_status, year);
    const cash = await getCashInvestment(scenarioID);
    if (cash.value > amtOwed) {
        // No need to sell expenses; Pay from cash

        // return here
    }
    // Cash is not enough and value now is 0
    const expenseWithdrawalStrategy = await getExpenseWithdrawalStrategy(scenarioID);
    // Sell based off expense strategy
}

/**
 * Returns scenario based on scenarioID
 * @param scenarioID scenario ID
 * @return Queried scenario
 */
const getScenario = async (scenarioID) => {
    const query = `
        SELECT * FROM scenarios
        WHERE id = ?
        LIMIT 1
    `
    [rows] = await connection.execute(query, [scenarioID]);
    return rows[0];
}

/**
 * Returns the cash investment for a given scenario
 * @param scenarioID ID of scenario of the cash investment
 * @returns the cash investment
 */
const getCashInvestment = async (scenarioID) => {
    const query = `
        SELECT * FROM EVENTS
        WHERE scenario_id = ? AND investment_type = ?
        LIMIT 1
    `
    const values = [
        scenarioID,
        "cash"
    ]

    const [cash] = await connection.execute(query, values);
    return cash[0];
}

/**
 * Returns a list of the investments of the Expense Withdrawal Strategy for a given scenario
 * @param scenarioID ID of scenario
 * @returns list of investments in order of the expense withdrawal strategy
 */
const getExpenseWithdrawalStrategy = async (scenarioID) => {
    const strategyQuery = `
        SELECT * FROM strategy
        WHERE scenario_id = ${scenarioID} AND strategy_type = "expense_withdrawal"
        ORDER BY strategy_order ASC
    `
    const [strategy] = await connection.execute(strategyQuery);

    // Now compile list of actual investment objects
    const investments = [];
    for (const elem of strategy) { // elem is the strategy object; retrieve investment from investment_id
        const query = `
            SELECT * FROM investments
            WHERE scenario_id = ${scenarioID} AND id = ${elem.investment_id}
            LIMIT 1
        `
        const [investment] = await connection.execute(query);
        investments.push(investment[0]);
    }
    return investments;
}

/**
 * Computes how much federal income tax a scenario would ower for the previous year
 * @param income yearly income
 * @param ssIncome social security income
 * @param filingStatus married or single
 * @param year indicates which tax bracket to retrieve
 * @return amount of taxes owed
 */
const computeFederal = async (income, ssIncome, filingStatus, year) => {
    // Prepare query for bracket calculations
    const query = `
        SELECT * FROM tax_brackets
        WHERE income_min < ? AND filing_status = ${filingStatus} AND year = ${year}
    `

    const fallbackQuery = `
        SELECT * FROM tax_brackets
        WHERE income_min < ? AND filing_status = ${filingStatus} AND year > ?
    `

    let sum = 0;
    // Each event will be taxed individually and added to an overall sum
    let [brackets] = await connection.execute(query, income);
    if (brackets.length == 0) {
        brackets = await connection.execute(fallbackQuery, [income, year])
    }

    for (const bracket of brackets) {
        if (income > bracket.income_max) { // Checks if we are in a bracket that is completely full
            sum += (bracket.income_max * bracket.tax_rate);
        }
        else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
            sum += ((income - bracket.income_min) * bracket.tax_rate);
        }
    }

    // Social Security Calculation
    const ssIncomeReduced = ssIncome * .85;
    for (const bracket of brackets) {
        if (ssIncomeReduced > bracket.income_max) { // Checks if we are in a bracket that is completely full
            sum += (bracket.income_max * bracket.tax_rate);
        }
        else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
            sum += ((ssIncomeReduced - bracket.income_min) * bracket.tax_rate);
        }
    }
    return sum;
}

/**
 * Computes how much state income tax a scenario would owe for the previous year (Excludes social security)
 * @param income yearly income (does not include social security)
 * @param filingStatus married or single
 * @param state state of residence
 * @param year indicates which tax bracket to retrieve
 * @return amount of taxes owed
 */
const computeState = async (income, filingStatus, state, year) => {
    // Prepare query for bracket calculations
    const query = `
        SELECT * FROM state_tax_brackets
        WHERE income_min < ? AND filing_status = ${filingStatus} AND state = ${state} AND year = ${year}
    `

    const fallbackQuery = `
        SELECT * FROM state_tax_brackets
        WHERE income_min < ? AND filing_status = ${filingStatus} AND state = ${state} AND year > ?
    `

    let sum = 0;
    // Each event will be taxed individually and added to an overall sum
    let [brackets] = await connection.execute(query, [income]);
    if (brackets.length == 0) { // No brackets for current year
        brackets = await connection.execute(fallbackQuery, [income, year])
    }

    for (const bracket of brackets) {
        if (income > bracket.income_max) { // Checks if we are in a bracket that is completely full
            sum += ((bracket.income_max * bracket.tax_rate) + bracket.base);
        }
        else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
            sum += (((income - bracket.income_min) * bracket.tax_rate) + bracket.base);
        }
    }
    return sum;
}

/**
 * Retrieves the deduction for the marital_status in the scenario
 * @param filingStatus individual or couple
 * @param year indicates which tax bracket to retrieve
 * @returns deduction value
 */
const getDeduction = async (filingStatus, year) => {
    let filing;
    if (filingStatus == "individual") {
        filing = "single";
    }
    else {
        filing = "married";
    }

    query = `
        SELECT * FROM standard_deductions
        WHERE filing_status = ${filing} AND year = ${year}
        LIMIT 1
    `
    const [rows] = await connection.execute(query)
    return rows[0].standard_deduction;
}