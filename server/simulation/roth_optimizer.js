import { connection } from "../server.js";

export async function runRothOptimizer(scenarioId) {

    //this is only for logged in user, for guest user, we need to fetch the data from local storage
    
    strategy = await getRothStrategy(scenarioId);
    // roth conversion strat doesn't exist if optimizer is off
    if(!strategy) console.log("Roth conversion optimizer is turned off. Skipping Roth conversion step."); return;


}

export async function getRothStrategy(scenarioId) {
    console.log(`Fetching Roth strategy info from DB for scenario ID: ${scenarioId}`);
    await ensureConnection();

    const [rows] = await connection.execute(
        `SELECT 
            id,
            investment_id,
            strategy_order,
         FROM strategy
         WHERE scenario_id = ? AND strategy_type = 'rothConversionStrat'`,
        [scenarioId]
    );
    console.log("strategy rows", rows);
    return rows;
}
