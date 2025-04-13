import { connection } from "../server.js";
import { ensureConnection } from "../server.js";
import { getFilingStatus } from "./monte_carlo_sim.js"

export async function runRothOptimizer(scenarioId, rothStrategy, incomeEvents) {

    console.log(`Running Roth optimizer for scenario ID: ${scenarioId}`);
    // step 1: determine user tax bracket and conversion amount:
    const conversionAmt = await getMaxConversionAmt(scenarioId, incomeEvents)
    if(conversionAmt == 0) return;

}

async function getMaxConversionAmt(scenarioId, incomeEvents) {

    // total the user's income for the year
    let totalIncome = 0;
    for(let i=0; i<incomeEvents.length; i++){
        totalIncome += incomeEvents[i].currentAmount;
    }
    const filingStatus = await getFilingStatus(scenarioId);
    const taxBrackets = await getTaxBrackets(filingStatus);
    let userMax = taxBrackets[0].income_max;
    for(let i=0; i<taxBrackets.length; i++){
        if(totalIncome <= taxBrackets[i].income_max) {
            userMax = taxBrackets[i].income_max;
            break;
        }
    }
    console.log(`Total income for the year is $${totalIncome}, can convert up
        to $${userMax-totalIncome} until the next tax bracket at $${userMax}`);
    return userMax - totalIncome;
}

async function getTaxBrackets(filingStatus) {
    await ensureConnection();
    const [rows] = await connection.execute(
        `SELECT 
            income_max
         FROM tax_brackets
         WHERE filing_status = ?`,
        [filingStatus]
    );
    return rows;
}

// select ordering only
export async function getRothStrategy(scenarioId) {
    await ensureConnection();
    const [rows] = await connection.execute(
        `SELECT 
            id,
            investment_id,
            strategy_order
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'roth'`,
        [scenarioId]
    );
    return rows;
}

// select start and end year for the roth conversion strategy
export async function getRothYears(scenarioId) {
    await ensureConnection();
    // Copilot prompt: select only the first row where this constraint applies
    const [rows] = await connection.execute(
        `SELECT
            start_year,
            end_year
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'roth'
         LIMIT 1`,
        [scenarioId]
    );
    return rows[0];
}
