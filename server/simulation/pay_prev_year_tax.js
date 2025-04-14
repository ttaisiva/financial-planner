import { ensureConnection, connection } from "../server.js";
// NEED TO USE:
// - expense withdrawal strategy: ordering on set of investments to use if cash account doesn't have enough
// - state and federal tax
// - non-discretionary expenses (events)

// - Get income + marriage status; Pull year-1 tax bracket. {rate} * income is how much is owed.
// - If cash is not enough, find the difference and sell based on expense withdrawal strategy.


export async function payTaxes(scenarioID) {
    await ensureConnection();
    const scenario = await getScenario(scenarioID);
    const incomeEvents = await getIncomeEvents(scenarioID); // List of income events

    const amtOwed = computeFederal(incomeEvents, scenario.marital_status) + computeState(incomeEvents, scenario.marital_status, scenario.residence_state);
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