import { connection } from "../server.js";
import { ensureConnection } from "../server.js";

export async function payNondiscExpenses(scenarioId, investments, year) {

    const expenses = await getNondiscExpenses(scenarioId);
    if (expenses.length === 0) {
        console.log("No non-discretionary expenses found for scenario ID #", scenarioId);
        return;
    }
    let totalExpense = 0;
    for(let i=0; i<expenses.length; i++) {
    }

}
async function getNondiscExpenses(scenarioId) {
    console.log(`Fetching non discretionary expenses from DB for scenario ID: ${scenarioId}`);
    await ensureConnection();

    const [rows] = await connection.execute(
        `SELECT 
            id,
            name,
            description,
            type,
            start,
            duration,
            change_distribution as changeDist,
            initial_amount as initialAmt,
            change_amt_or_pct as changeType,
            inflation_adjusted as inflationAdjusted,
            user_fraction as userFraction
         FROM events
         WHERE scenario_id = ? AND type='expense' AND discretionary=0`,
        [scenarioId]
    );
    return rows;
    
}
