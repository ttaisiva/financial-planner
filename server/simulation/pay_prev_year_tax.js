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
export async function payTaxes(scenarioID, incomeEvents) {
    await ensureConnection();
    const scenario = await getScenario(scenarioID);
    // const incomeEvents = await getIncomeEvents(scenarioID); // List of income events

    // Find the amount owed by taxing all sources of income federally and by state
    const amtOwed = (await computeFederal(incomeEvents, scenario.marital_status) + await computeState(incomeEvents, scenario.marital_status, scenario.residence_state)) - await getDeduction(scenario.marital_status);
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
 * Returns list of event series of only the income type for a given scenario
 * @param scenarioID scenario ID
 * @return list of income events
 */
const getIncomeEvents = async (scenarioID) => {
    const query = `
        SELECT * FROM events
        WHERE scenario_id=? AND type=?
    `
    const values = [
        scenarioID,
        "income"
    ]

    return await connection.execute(query, values);
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
 * @param incomeEvents list of income events that will be taxed
 * @param filingStatus married or single
 * @return amount of taxes owed
 */
const computeFederal = async (incomeEvents, filingStatus) => {
    // Prepare query for bracket calculations
    const query = `
        SELECT * FROM tax_brackets
        WHERE income_min < ? AND filing_status = ${filingStatus}
    `

    let sum = 0;
    // Each event will be taxed individually and added to an overall sum
    for (const ev of incomeEvents) {
        const brackets = await connection.execute(query, [ev.initial_amount]);
        for (const bracket of brackets) {
            if (ev.initial_amount > bracket.income_max) { // Checks if we are in a bracket that is completely full
                sum += (bracket.income_max * bracket.tax_rate);
            }
            else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
                sum += ((ev.initial_amount - bracket.income_min) * bracket.tax_rate);
            }
        }
    }
    return sum;
}

/**
 * Computes how much state income tax a scenario would owe for the previous year (Excludes social security)
 * @param incomeEvents list of income events that will be taxed
 * @param filingStatus married or single
 * @param state state of residence
 * @return amount of taxes owed
 */
const computeState = async (incomeEvents, filingStatus, state) => {
    // Prepare query for bracket calculations
    const query = `
        SELECT * FROM state_tax_brackets
        WHERE income_min < ? AND filing_status = ${filingStatus} AND state = ${state}
    `

    let sum = 0;
    // Each event will be taxed individually and added to an overall sum
    for (const ev of incomeEvents) {
        if (ev.social_security == 0) {
            const brackets = await connection.execute(query, [ev.initial_amount]);
            for (const bracket of brackets) {
                if (ev.initial_amount > bracket.income_max) { // Checks if we are in a bracket that is completely full
                    sum += (bracket.income_max * bracket.tax_rate);
                }
                else { // Final bracket (meaning initial_amount is less than income_max); Tax applied to initial_amount - income_min
                    sum += ((ev.initial_amount - bracket.income_min) * bracket.tax_rate);
                }
            }
        }
    }
    return sum;
}