import { connection } from "../server.js";
import { ensureConnection } from "../server.js";
import { getFilingStatus } from "./monte_carlo_sim.js"

export async function runRothOptimizer(scenarioId, rothStrategy, incomeEvents, investments) {

    console.log(`Running Roth optimizer for scenario ID: ${scenarioId}`);
    // step 1: determine user tax bracket and conversion amount:
    let conversionAmt = await getMaxConversionAmt(scenarioId, incomeEvents)

    // transfer pre-tax to after-tax until amount is reached
    for(let i=0; i<rothStrategy.length; i++) {
        if(conversionAmt === 0) break;

        // Copilot prompt: find the object in array "investments" whose id matches rothStrategy[i].id
        let pretax = investments.find(investment => investment.id === rothStrategy[i].investment_id);

        if(pretax.dollarValue <= conversionAmt) {
            // transfer entire thing to equivalent account by just changing it to an after-tax account
            conversionAmt -= pretax.dollarValue;
            pretax.taxStatus = "After-Tax";
            // TODO: remove from strategy bc its not pre tax anymore
            rothStrategy = rothStrategy.filter(strategy => strategy.investment_id !== pretax.id);
        } else {
            // check if after tax equivalent exists
            // Copilot prompt: use investments.find to look for an element with .type that is the same as pretax.type
            let aftertax = investments.find(investment => investment.type === pretax.type && investment.taxStatus === "After-Tax");
            if(aftertax) {
                aftertax.dollarValue += conversionAmt;
                pretax.dollarValue -= conversionAmt;
            } else {
                // create new after tax investment to transfer to
                const newInvestment = {
                    id: investments.length + 1, // really not sure about this
                    type: pretax.type,
                    taxStatus: "After-Tax",
                    dollarValue: conversionAmt
                };
                investments.push(newInvestment);
            }
            conversionAmt = 0;
        }
    }
    return {investments, rothStrategy}
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
